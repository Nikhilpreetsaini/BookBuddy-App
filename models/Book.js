const mongoose = require('mongoose');

// A Book represents a physical or digital book in the system.  Books can be
// created by any authenticated user and are used to record reading logs and
// tag posts.  Popularity is increased when users record reads for the book.
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String },
  genre: { type: String },
  description: { type: String },
  location: { type: String },
  coverPhoto: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalReads: { type: Number, default: 0 },
  popularity: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', bookSchema);
