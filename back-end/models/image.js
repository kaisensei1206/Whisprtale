const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  image: Buffer,
  contentType: String,
  caption: String,
  description: String,
});

module.exports = mongoose.model('Image', ImageSchema);
