const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  contentType: {
    type: String,
    enum: ['image', 'video', 'audio', 'text', 'live'],
    required: true
  },
  mediaUrl: String,
  thumbnailUrl: String,
  tags: [String],
  isExclusive: {
    type: Boolean,
    default: false
  },
  requiredTier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionTier'
  },
  isPaidContent: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  scheduleDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ContentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Content', ContentSchema);