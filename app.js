require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Import models
const User = require('./models/User');
const Book = require('./models/Book');
const ReadLog = require('./models/ReadLog');
const Streak = require('./models/Streak');
const Post = require('./models/Post');
const Connection = require('./models/Connection');
const Donation = require('./models/Donation');

// Authentication middleware
const auth = require('./middleware/auth');

const app = express();

// Configure uploads – store files in uploads/ with unique names
const uploadsDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Preserve original extension
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to BookBuddy API' });
});

// User registration
app.post('/register', async (req, res) => {
  try {
    const { fullName, nickname, profession, phoneNumber, password, confirmPassword } = req.body;
    if (!fullName || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      fullName,
      nickname,
      profession,
      phoneNumber,
      password: hashedPassword
    });
    await user.save();
    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // Exclude password from response
    const { password: pwd, ...userData } = user.toObject();
    res.status(201).json({ message: 'Registration successful', token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// User login
app.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
      return res.status(400).json({ message: 'Phone number and password are required' });
    }
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ message: 'Invalid phone number or password' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid phone number or password' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: pwd, ...userData } = user.toObject();
    res.json({ message: 'Login successful', token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
app.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new book
app.post('/books', auth, upload.single('cover'), async (req, res) => {
  try {
    const { title, author, genre, description, location } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    const coverPhoto = req.file ? `/uploads/${req.file.filename}` : undefined;
    const book = new Book({
      title,
      author,
      genre,
      description,
      location,
      coverPhoto,
      createdBy: req.user.id
    });
    await book.save();
    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalBooksAdded: 1, reputation: 10 }
    });
    res.status(201).json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all books
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find().populate('createdBy', 'fullName nickname');
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a reading log
app.post('/read', auth, upload.single('photo'), async (req, res) => {
  try {
    const { bookId, note } = req.body;
    if (!bookId) return res.status(400).json({ message: 'bookId is required' });
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    const photo = req.file ? `/uploads/${req.file.filename}` : undefined;
    const log = new ReadLog({ book: bookId, readBy: req.user.id, note, photo });
    await log.save();
    // Update book stats
    book.totalReads += 1;
    book.popularity += 1;
    await book.save();
    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalReads: 1, reputation: 2 }
    });
    // Handle streak
    let streak = await Streak.findOne({ user: req.user.id, book: bookId });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (!streak) {
      streak = new Streak({ user: req.user.id, book: bookId, readDates: [now] });
    } else {
      const lastReadDate = streak.lastReadDate;
      const lastDay = new Date(lastReadDate.getFullYear(), lastReadDate.getMonth(), lastReadDate.getDate());
      const diffDays = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        // Continue streak
        streak.currentStreak += 1;
        if (streak.currentStreak > streak.longestStreak) streak.longestStreak = streak.currentStreak;
      } else if (diffDays > 1) {
        // Reset streak
        streak.currentStreak = 1;
      }
      streak.readDates.push(now);
      streak.totalReads += 1;
      streak.lastReadDate = now;
    }
    await streak.save();
    res.status(201).json({ log, streak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reading logs for a book
app.get('/books/:id/reads', async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await ReadLog.find({ book: id }).populate('readBy', 'fullName nickname').sort({ readAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a post (review or update)
app.post('/posts', auth, upload.array('media', 10), async (req, res) => {
  try {
    const { caption, taggedBooks, isReview, location } = req.body;
    let tagged = [];
    if (taggedBooks) {
      try {
        tagged = JSON.parse(taggedBooks);
      } catch (e) {
        // If parsing fails treat as empty
        tagged = [];
      }
    }
    const media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const mime = file.mimetype;
        const mediaType = mime.startsWith('video') ? 'video' : 'photo';
        media.push({ url: `/uploads/${file.filename}`, mediaType });
      }
    }
    const post = new Post({
      caption,
      media,
      taggedBooks: tagged,
      isReview: isReview === 'true' || isReview === true,
      location,
      author: req.user.id
    });
    await post.save();
    // Update user reputation
    await User.findByIdAndUpdate(req.user.id, { $inc: { reputation: 5 } });
    const populated = await Post.findById(post._id)
      .populate('author', 'fullName nickname')
      .populate('taggedBooks', 'title author');
    res.status(201).json({ message: 'Post created', post: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'fullName nickname')
      .populate('taggedBooks', 'title author');
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like or unlike a post
app.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const userId = req.user.id;
    const index = post.likes.indexOf(userId);
    let liked;
    if (index === -1) {
      post.likes.push(userId);
      liked = true;
      // Increase reputation for liking
      await User.findByIdAndUpdate(userId, { $inc: { reputation: 1 } });
    } else {
      post.likes.splice(index, 1);
      liked = false;
      // Decrease reputation when unliking
      await User.findByIdAndUpdate(userId, { $inc: { reputation: -1 } });
    }
    await post.save();
    res.json({ liked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a comment
app.post('/posts/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text is required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.comments.push({ text, author: req.user.id });
    await post.save();
    // Increase user reputation for commenting
    await User.findByIdAndUpdate(req.user.id, { $inc: { reputation: 2 } });
    const newComment = post.comments[post.comments.length - 1];
    const populatedComment = await Post.populate(newComment, { path: 'author', select: 'fullName nickname' });
    res.status(201).json(populatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user streaks
app.get('/streaks', auth, async (req, res) => {
  try {
    const streaks = await Streak.find({ user: req.user.id })
      .populate('book', 'title author')
      .sort({ longestStreak: -1 });
    res.json(streaks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a friend request
app.post('/connect', auth, async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ message: 'recipientId is required' });
    if (recipientId === req.user.id) {
      return res.status(400).json({ message: 'You cannot connect with yourself' });
    }
    const existing = await Connection.findOne({
      $or: [
        { requester: req.user.id, recipient: recipientId },
        { requester: recipientId, recipient: req.user.id }
      ]
    });
    if (existing) {
      return res.status(400).json({ message: 'Connection already exists' });
    }
    const connection = new Connection({ requester: req.user.id, recipient: recipientId });
    await connection.save();
    res.status(201).json(connection);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Respond to a friend request
app.put('/connect/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const connection = await Connection.findById(req.params.id);
    if (!connection) return res.status(404).json({ message: 'Connection not found' });
    if (connection.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised to respond to this request' });
    }
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    connection.status = status;
    await connection.save();
    if (status === 'accepted') {
      // Add each user to the other’s friends list
      await User.findByIdAndUpdate(connection.requester, { $addToSet: { friends: connection.recipient } });
      await User.findByIdAndUpdate(connection.recipient, { $addToSet: { friends: connection.requester } });
    }
    res.json(connection);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user connections
app.get('/connections', auth, async (req, res) => {
  try {
    const cons = await Connection.find({
      $or: [ { requester: req.user.id }, { recipient: req.user.id } ]
    }).populate('requester recipient', 'fullName nickname');
    res.json(cons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Donate to a user or book
app.post('/donate', auth, async (req, res) => {
  try {
    const { recipientId, amount, message, bookId } = req.body;
    if (!recipientId || !amount) {
      return res.status(400).json({ message: 'recipientId and amount are required' });
    }
    if (recipientId === req.user.id) {
      return res.status(400).json({ message: 'You cannot donate to yourself' });
    }
    const donation = new Donation({
      donor: req.user.id,
      recipient: recipientId,
      amount,
      message,
      book: bookId
    });
    await donation.save();
    // Update recipient stats – 1 reputation point per 10 units donated (rounded down)
    const incReputation = Math.floor(amount / 10);
    await User.findByIdAndUpdate(recipientId, {
      $inc: { totalDonations: amount, reputation: incReputation }
    });
    res.status(201).json(donation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leaderboard – top users and books
app.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find().sort({ reputation: -1, totalReads: -1, totalBooksAdded: -1 }).limit(10).select('fullName nickname reputation totalBooksAdded totalReads totalDonations');
    const topBooks = await Book.find().sort({ popularity: -1, totalReads: -1 }).limit(10).select('title author genre popularity totalReads');
    res.json({ topUsers, topBooks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`BookBuddy server listening on port ${PORT}`);
});