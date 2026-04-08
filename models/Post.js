const mongoose = require('mongoose');

// A comment on a post contains the text and a reference to the author.
const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Media attached to a post – either photos or videos.  The client sets the
// mediaType based on the MIME type of the uploaded file.
const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  mediaType: { type: String, enum: ['photo', 'video'], default: 'photo' }
});

// A Post represents a user’s review or update.  Posts can tag books and
// optionally be marked as reviews.  Users can like or comment on posts.
const postSchema = new mongoose.Schema({
  caption: { type: String },
  media: [mediaSchema],
  taggedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  isReview: { type: Boolean, default: false },
  location: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
