const mongoose = require('mongoose');

// A ReadLog records a single reading session for a book.  It can include a
// note and an optional photo.  The log links the book and the user who read it.
const readLogSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  readBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String },
  photo: { type: String },
  readAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReadLog', readLogSchema);
