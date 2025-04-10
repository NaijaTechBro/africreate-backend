const User = require('../models/userModel');
const Content = require('../models/contentModel');
const Subscription = require('../models/subscriptionModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Controller methods for user-related operations
const userController = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      const username = req.params.username;
      const user = await User.findOne({ username })
        .select('-password -userAgent')
        .populate('followers', 'username profilePicture')
        .populate('following', 'username profilePicture');

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Get content count
      const contentCount = await Content.countDocuments({ creator: user._id });
      const userWithContentCount = { ...user._doc, contentCount };

      return res.status(200).json({
        success: true,
        user: userWithContentCount
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Get popular creators
  getPopularCreators: async (req, res) => {
    try {
      const creators = await User.find({ isCreator: true })
        .sort({ 'followers.length': -1 })
        .limit(10)
        .select('username profilePicture bio followers');
      
      return res.status(200).json({
        success: true,
        creators
      });
    } catch (error) {
      console.error('Error getting popular creators:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Get creator stats
  getCreatorStats: async (req, res) => {
    try {
      if (!req.user.isCreator) {
        return res.status(403).json({ success: false, message: 'Not authorized as creator' });
      }

      const creatorId = req.user._id;
      
      // Get subscriber count
      const subscriberCount = await Subscription.countDocuments({ 
        creator: creatorId,
        isActive: true
      });
      
      // Get content count
      const contentCount = await Content.countDocuments({ creator: creatorId });
      
      // Calculate total revenue
      const subscriptions = await Subscription.find({ creator: creatorId });
      const totalRevenue = subscriptions.reduce((total, sub) => total + sub.price, 0);
      
      // Calculate total views
      const contents = await Content.find({ creator: creatorId });
      const totalViews = contents.reduce((total, content) => total + content.views, 0);

      const stats = {
        totalSubscribers: subscriberCount,
        totalContent: contentCount,
        totalRevenue: totalRevenue,
        totalViews: totalViews
      };

      return res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error getting creator stats:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

module.exports = userController;