const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  account: {
    type: String,
    required: true,
  },
  password: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  realname: {  // Added field for real name
    type: String,
  },
  bday: {  // Added field for birthday
    type: Date,
  },
  phoneNumber: {  // Added field for phone number
    type: String,
  },
  savedBooks: [{ type: Schema.Types.ObjectId, ref: 'Story' }],
  likedBooks: [{ type: Schema.Types.ObjectId, ref: 'Story' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);


