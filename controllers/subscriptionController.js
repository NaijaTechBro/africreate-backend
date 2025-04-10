const Subscription = require('../models/subscriptionModel');
const User = require('../models/userModel');

// Controller methods for subscription-related operations
const subscriptionController = {
  // Get user's subscriptions
  getUserSubscriptions: async (req, res) => {
    try {
      const userId = req.user._id;
      
      const subscriptions = await Subscription.find({ subscriber: userId })
        .populate('creator', 'username profilePicture bio')
        .populate('tier', 'name price benefits');
      
      return res.status(200).json({
        success: true,
        subscriptions
      });
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Get creator's subscribers
  getCreatorSubscriptions: async (req, res) => {
    try {
      if (!req.user.isCreator) {
        return res.status(403).json({ success: false, message: 'Not authorized as creator' });
      }

      const creatorId = req.user._id;
      
      const subscriptions = await Subscription.find({ creator: creatorId })
        .populate('subscriber', 'username profilePicture')
        .populate('tier', 'name price benefits');
      
      return res.status(200).json({
        success: true,
        subscriptions
      });
    } catch (error) {
      console.error('Error getting creator subscriptions:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Check if user is subscribed to creator
  checkSubscription: async (req, res) => {
    try {
      const userId = req.user._id;
      const creatorId = req.params.creatorId;
      
      const subscription = await Subscription.findOne({
        subscriber: userId,
        creator: creatorId,
        isActive: true
      });
      
      return res.status(200).json({
        success: true,
        isSubscribed: !!subscription
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Subscribe to creator
  subscribe: async (req, res) => {
    try {
      const userId = req.user._id;
      const { creatorId, tierId, paymentMethod, price, currency } = req.body;
      
      // Validate required fields
      if (!creatorId || !tierId || !paymentMethod || !price) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Check if creator exists and is a creator
      const creator = await User.findOne({ _id: creatorId, isCreator: true });
      if (!creator) {
        return res.status(404).json({ success: false, message: 'Creator not found' });
      }

      // Check if user is already subscribed
      const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        creator: creatorId,
        isActive: true
      });

      if (existingSubscription) {
        return res.status(400).json({ success: false, message: 'Already subscribed to this creator' });
      }

      // Calculate end date (1 month from now)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      // Create new subscription
      const newSubscription = new Subscription({
        subscriber: userId,
        creator: creatorId,
        tier: tierId,
        startDate,
        endDate,
        isActive: true,
        autoRenew: true,
        paymentMethod,
        price,
        currency: currency || 'USD',
        paymentHistory: [{
          transactionId: `tx_${Math.random().toString(36).substr(2, 9)}`,
          amount: price,
          currency: currency || 'USD',
          status: 'completed',
          date: new Date()
        }]
      });

      const savedSubscription = await newSubscription.save();
      
      // Populate subscription data for response
      const populatedSubscription = await Subscription.findById(savedSubscription._id)
        .populate('creator', 'username profilePicture')
        .populate('tier', 'name price benefits');

      return res.status(201).json({
        success: true,
        subscription: populatedSubscription
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

module.exports = subscriptionController;