const mongoose = require('mongoose');

// The Streak model tracks consecutive reading sessions for a user and a book.
// Each new read either continues the current streak if performed on the next
// day or resets it otherwise.  The longest streak is preserved for leaderboard
// purposes.
const streakSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  currentStreak: { type: Number, default: 1 },
  longestStreak: { type: Number, default: 1 },
  lastReadDate: { type: Date, default: Date.now },
  readDates: { type: [Date], default: [] },
  totalReads: { type: Number, default: 1 }
});

module.exports = mongoose.model('Streak', streakSchema);
