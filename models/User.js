const mongoose = require('mongoose');

// The User schema stores profile information along with statistics used for leaderboards.
// Authentication is handled via bcrypt and JWT in the routes defined in app.js.
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  nickname: { type: String },
  profession: { type: String },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favoriteBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  avatar: { type: String },
  reputation: { type: Number, default: 0 },
  totalBooksAdded: { type: Number, default: 0 },
  totalReads: { type: Number, default: 0 },
  totalDonations: { type: Number, default: 0 },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
