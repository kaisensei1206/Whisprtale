const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const storyContentSchema = new Schema({
  sentence: { type: String, required: true },
  imageUrl: { type: String, required: true }
});

const commentSchema = new Schema({
  username: String,
  text: String,
  date: { type: Date, default: Date.now }
});

const storySchema = new Schema({
  title: String,
  author: String,  // Store the username
  userId: { type: Schema.Types.ObjectId, ref: 'User' },  // Store the user ID separately
  content: [storyContentSchema],
  isPublished: Boolean,
  coverImage: String,
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },
  saved: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  genres: [String],
  summary: { type: String }
});

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
