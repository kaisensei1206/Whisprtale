const express = require('express');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const { OpenAI } = require('openai');
const ensureAuthenticated = require('../routes/ensureAuthenticated');
const mongoose = require('mongoose');
const Image = require('../models/image'); // Adjust the path as needed
const pos = require('pos');
const User = require('../models/user'); // Adjust the path if necessary

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: "sk-MUBeqO_mfIUtcYcWaZWUzIRdKiKfW5wJtMLLogFccfT3BlbkFJ-DlSHJvUxuWzHgQAQjxTXLhg_VbQwNZxGWfIuTh0IA",
});

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const Story = require('../models/story');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility function to detect if the text is in Chinese
function isChineseText(input) {
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(input);
}

// Utility function to detect if the text is in English
function isEnglishText(input) {
  const englishRegex = /^[a-zA-Z0-9\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]*$/;
  return englishRegex.test(input);
}

// Function to split English sentences
function splitSentences(text) {
  const sentenceRegex = /([.!?。！？](?!\d))/;
  const parts = text.split(sentenceRegex);
  let sentences = [];
  let currentSentence = '';

  parts.forEach(part => {
    const trimmedPart = part.trim();
    if (trimmedPart.length > 0) {
      if (!trimmedPart.match(sentenceRegex)) {
        currentSentence += trimmedPart;
      } else {
        currentSentence += trimmedPart;
        sentences.push(currentSentence.trim());
        currentSentence = '';
      }
    }
  });

  return sentences;
}

function splitChineseSentences(text) {
  // First, normalize the text by removing spaces, newlines, and unwanted characters
  let cleanedText = text.replace(/[\s\u00A0\uFEFF]+/g, '').replace(/[\r\n]+/g, '');

  // Try splitting using sentence-ending punctuation marks
  let sentences = cleanedText.split(/(?<=[。！？])/).map(sentence => sentence.trim()).filter(sentence => sentence.length > 0);

  // If no sentences were found, try splitting by commas as a fallback
  if (sentences.length === 1) {
    console.log('Fallback: Using commas for splitting.');
    sentences = cleanedText.split(/，/).map(sentence => sentence.trim()).filter(sentence => sentence.length > 0);
  }

  // If still only one sentence, attempt to split based on approximate lengths
  if (sentences.length === 1) {
    console.log('Fallback: Splitting based on approximate length.');
    const approxLength = 20; // Set an approximate sentence length for splitting
    let tempSentences = [];
    for (let i = 0; i < cleanedText.length; i += approxLength) {
      tempSentences.push(cleanedText.slice(i, i + approxLength));
    }
    sentences = tempSentences;
  }

  console.log('Cleaned Text:', cleanedText); // Inspect the cleaned text
  console.log('Split Sentences:', sentences); // Log the final split sentences
  return sentences;
}


function logUnicodeCharacters(text) {
  for (let i = 0; i < text.length; i++) {
    console.log(`Character: ${text[i]}, Unicode: ${text.charCodeAt(i)}`);
  }
}


// Function to preprocess input text
function preprocessInput(text) {
  return text.replace(/\b(\w+)'(ll|ve|re|d|s|t)\b/g, '$1$2')
    .replace(/\b(can|won|shan)'t\b/g, '$1not')
    .replace(/\b(\w+)'s\b/g, '$1s');
}

// Function to analyze text using POS (for English)
const tokenizer = new pos.Lexer();
const tagger = new pos.Tagger();

function analyzeText(input) {
  let words = tokenizer.lex(input);
  let taggedWords = tagger.tag(words);
  let results = {
    nouns: [],
    adjectives: [],
    verbs: [],
    adverbs: [],
    others: []
  };

  taggedWords.forEach((taggedWord) => {
    let word = taggedWord[0];
    let tag = taggedWord[1];

    if (tag.startsWith('NN')) {
      results.nouns.push(word);
    } else if (tag.startsWith('JJ')) {
      results.adjectives.push(word);
    } else if (tag.startsWith('VB')) {
      results.verbs.push(word);
    } else if (tag.startsWith('RB')) {
      results.adverbs.push(word);
    } else {
      results.others.push(word);
    }
  });

  return results;
}

// Function to process input text into a prompt
function processInput(input, isChinese = false) {
  if (isChinese) {
    // For Chinese text, just return the input text as the main part of the prompt
    return input;
  }

  // Existing processing for English text
  input = preprocessInput(input);
  let results = analyzeText(input);

  let output = [
    results.nouns.join(', '),
    results.adjectives.join(', '),
    results.verbs.join(', '),
    results.adverbs.join(', ')
  ].filter(part => part !== '').join(', ');

  return output;
}

// Enhanced function to sanitize prompts
function sanitizePrompt(prompt) {
  const forbiddenWords = [
    "kill", "death", "suicide", "violence", "terrorist", "shredder",
    "shredding", "weapon", "blood", "explosion", "war", "murder", "hate"
  ];

  let sanitizedPrompt = prompt;

  forbiddenWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    sanitizedPrompt = sanitizedPrompt.replace(regex, '[redacted]');
  });

  sanitizedPrompt = sanitizedPrompt.replace(/[^a-zA-Z0-9,.\s\u4e00-\u9fff]/g, '');

  return sanitizedPrompt.trim();
}

async function transcribeAudio(filePath, fileName) {
  console.log(`Reading file from path: ${filePath}`);

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), { filename: fileName });
  form.append('model', 'whisper-1');
  form.append('response_format', 'text');

  const headers = form.getHeaders();
  headers['Authorization'] = `Bearer ${openai.apiKey}`;

  try {
    // Make the API request without specifying a language to let Whisper auto-detect
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, { headers });
    const transcription = response.data;
    console.log('Transcription:', transcription);

    return transcription;
  } catch (error) {
    console.error('Transcription error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// Function to generate images
async function generateImage(prompt) {
  const sanitizedPrompt = sanitizePrompt(prompt);

  console.log('Sanitized Prompt:', sanitizedPrompt);

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: sanitizedPrompt,
      n: 1,
      size: "1792x1024"
    });

    const imageUrl = response.data[0].url;

    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    const imageBuffer = Buffer.from(imageResponse.data, 'base64');

    const contentType = imageResponse.headers['content-type'];

    if (!contentType) {
      throw new Error('Failed to get content type for the image.');
    }

    const newImage = new Image({
      image: imageBuffer,
      contentType: contentType,
      caption: '',
      description: ''
    });

    await newImage.save();

    return newImage._id;
  } catch (error) {
    console.error('Error generating image:', error);

    if (error.code === 'content_policy_violation') {
      console.warn('Content policy violation detected, generating fallback image.');
      const fallbackPrompt = "A generic book cover, abstract and artistic, best quality";
      return await generateImage(fallbackPrompt);
    }

    throw new Error('Failed to generate image.');
  }
}
async function determineGenre(story) {
  try {
    // Adjust the prompt to ask for 1 to 2 genres, emphasizing English output
    const prompt = `Determine 1 to 2 genres for the following story: "${story}". The genres must be in English. Return the genres separated by commas.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 20,  // Adjusted for potentially returning two genres
      temperature: 0.1, // Low temperature for predictable output
      stop: ['\n'],
    });

    // Log the entire response for debugging
    console.log('OpenAI Full Response:', JSON.stringify(response, null, 2));

    let genres = response.choices[0].message.content.trim().split(',').map(genre => genre.trim());

    const validGenres = [
      'Fantasy', 'Drama', 'Science Fiction', 'Non Fiction', 'Horror', 'Comedy',
      'Literary Fiction', 'Historical Fiction', 'Mystery', 'Thriller', 'Romance',
      'Adventure', 'Young Adult', 'Dystopian', 'Biography', 'Memoir', 'Self-Help',
      'True Crime', 'History', 'Philosophy', 'Science', 'Travel', 'Cookbooks',
      'Essay Collections', 'Guide/How-to', 'Urban Fantasy', 'Space Opera',
      'Cyberpunk', 'Steampunk', 'Paranormal Romance', 'Cozy Mystery', 'Noir',
      'Epic Fantasy', 'Gothic', 'Psychological Thriller', 'Political Thriller',
      'Narrative Poetry', 'Lyrical Poetry', 'Haiku', 'Sonnet', 'Free Verse',
      'Tragedy', 'Melodrama', 'Tragicomedy', 'Picture Books', 'Middle Grade',
      'Early Readers', 'Superhero', 'Manga', 'Webcomics', 'fairy tale'
    ];

    // Filter out any invalid genres
    genres = genres.filter(genre => validGenres.includes(genre));

    if (genres.length === 0) {
      console.error('No valid genres returned:', genres);
      return ['Literary Fiction'];  // Fallback genre if none is valid
    }

    return genres;
  } catch (error) {
    console.error('Error determining genre:', error);
    return ['Literary Fiction'];  // Fallback genre on error
  }
}

async function generateSummary(sentences) {
  const storyText = sentences.join(' ');
  const sentenceCount = sentences.length;

  const prompt = sentenceCount <= 4
    ? `Summarize the following story in one sentence: "${storyText}", no spoilers, general summary`
    : `Summarize the following story in two sentences: "${storyText}", no spoilers, general summary`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    const summary = response.choices[0].message.content.trim();
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    return null;
  }
}


router.post('/process-story', ensureAuthenticated, upload.single('audio'), async (req, res) => {
  try {
    console.log('Received data:', req.body);
    const { title, storyText } = req.body;
    const userId = req.user._id;  // The ObjectId of the logged-in user
    const authorName = req.user.account;  // The username from the `account` field

    let sentences = [];
    let isChinese = false;
    let transcription = '';

    if (storyText) {
      // Detect if the input text is Chinese
      isChinese = isChineseText(storyText);
      sentences = isChinese ? splitChineseSentences(storyText) : splitSentences(storyText);
    } else if (req.file) {
      transcription = await transcribeAudio(req.file.path, req.file.originalname);

      // Debug: Log all characters in the transcription
      console.log('Logging Unicode characters in transcription:');
      logUnicodeCharacters(transcription);

      // Check if the transcription contains Chinese characters
      isChinese = isChineseText(transcription);
      console.log(`Is Chinese: ${isChinese}`);

      // Split the transcription into sentences based on the detected language
      sentences = isChinese ? splitChineseSentences(transcription) : splitSentences(transcription);
      console.log('Split Sentences:', sentences);
    } else {
      return res.status(400).json({ error: 'No story text or audio provided.' });
    }

    // Check if sentences array is populated
    if (sentences.length === 0) {
      return res.status(400).json({ error: 'No sentences found in the transcription.' });
    }

    // Generate a summary based on the number of sentences
    const summary = await generateSummary(sentences);

    // Generate the cover image
    const coverPrompt = `Book cover image, based on the entire story: "${title}", without any text`;
    const coverImageId = await generateImage(coverPrompt);

    const storyContent = [{ sentence: title, imageUrl: coverImageId }];

    // Determine 1 to 2 genres for the story
    const genres = await determineGenre(storyText || transcription);

    // Process each sentence
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      let prompt = processInput(sentence, isChinese);

      // Ensure the title is part of the prompt if it's the first sentence
      if (i === 0) {
        prompt = `${title}, ${prompt}`;
      }

      prompt += `, ${genres.join(', ')}, best quality, masterpiece, no text`;

      // Generate an image for each sentence
      const imageId = await generateImage(prompt);
      console.log(`Generated image for sentence ${i + 1}: ${sentence}`);

      // Push the sentence and image into the story content
      storyContent.push({ sentence, imageUrl: imageId });

      // Pause after every 5 images to respect rate limits
      if ((i + 1) % 5 === 0) {
        console.log(`Pausing for 30 seconds after generating ${i + 1} images...`);
        await delay(30000);
      }
    }

    // Save the story in the database
    const story = new Story({
      title,
      author: authorName,
      userId: userId,
      content: storyContent,
      isPublished: false,
      likes: [],
      likeCount: 0,
      genres,  // Directly assign the array of genres
      summary  // Save the generated summary
    });

    await story.save();

    res.json({ success: true, storyId: story._id });
  } catch (error) {
    console.error('Error processing story:', error);
    res.status(500).json({ error: 'Failed to process the story.' });
  }
});




router.get('/images', async (req, res) => {
  try {
    const images = await Image.find(); // Fetch all images from the database
    res.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/image/:id', async (req, res) => {
  console.log('Fetching image with ID:', req.params.id);

  try {
    const imageId = req.params.id;
    const image = await Image.findById(imageId);

    if (!image) {
      console.log('Image not found');
      return res.status(404).send('Image not found');
    }

    res.set('Content-Type', image.contentType);
    res.send(image.image);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/story/:id', ensureAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.id;
    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    res.json({ success: true, story });
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ success: false, message: 'Error fetching story.' });
  }
});

router.post('/regenerate-image', ensureAuthenticated, async (req, res) => {
  const { storyId, sentence, pageNumber } = req.body;

  if (!storyId || !sentence || !pageNumber) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const prompt = processInput(sentence);
    const newImageUrl = await generateImage(prompt);

    // Assuming you have a function to update the specific image in the database
    await updateStoryImage(storyId, pageNumber, newImageUrl);

    res.json({ success: true, newImageUrl });
  } catch (error) {
    console.error('Error regenerating image:', error);
    res.status(500).json({ success: false, message: 'Error regenerating image' });
  }
});

async function updateStoryImage(storyId, pageNumber, newImageUrl) {
  const story = await Story.findById(storyId);
  if (!story) {
    throw new Error('Story not found');
  }

  story.content[pageNumber - 1].imageUrl = newImageUrl; // Update image URL
  await story.save();
}

module.exports = router;

