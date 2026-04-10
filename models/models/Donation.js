const mongoose = require('mongoose');

// Donations allow users to send either book objects or monetary points to
// another user.  The status field is included for future expansion, although
// currently all donations are considered complete immediately.
const donationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  amount: { type: Number, required: true },
  message: { type: String },
  status: { type: String, default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donation', donationSchema);
