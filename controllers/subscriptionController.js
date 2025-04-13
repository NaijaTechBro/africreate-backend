const Subscription = require('../models/subscriptionModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

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
        .populate('subscriber', 'username profilePicture email')
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

      // Set next billing date
      const nextBillingDate = new Date(endDate);

      // Create new subscription
      const newSubscription = new Subscription({
        subscriber: userId,
        creator: creatorId,
        tier: tierId,
        startDate,
        endDate,
        nextBillingDate,
        isActive: true,
        autoRenew: true,
        paymentMethod,
        price,
        currency: currency || 'USD',
        status: 'active',
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
  },

  // Cancel subscription
  cancelSubscription: async (req, res) => {
    try {
      const subscriptionId = req.params.subscriptionId;
      const userId = req.user._id;
      
      // Find the subscription
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ success: false, message: 'Subscription not found' });
      }
      
      // Check if user owns this subscription
      if (subscription.subscriber.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to cancel this subscription' });
      }
      
      // Update subscription
      subscription.autoRenew = false;
      subscription.status = 'canceled';
      // endDate remains the same (subscription still valid until end date)
      
      await subscription.save();
      
      return res.status(200).json({
        success: true,
        message: 'Subscription canceled successfully',
        subscription
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  
  // Get subscription earnings
  getSubscriptionEarnings: async (req, res) => {
    try {
      const creatorId = req.user._id;
      
      // Verify user is a creator
      if (!req.user.isCreator) {
        return res.status(403).json({ success: false, message: 'Not authorized as creator' });
      }
      
      // Optional period filtering
      const { period } = req.query;
      let dateFilter = {};
      
      const now = new Date();
      if (period === 'week') {
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        dateFilter = { 'paymentHistory.date': { $gte: lastWeek } };
      } else if (period === 'month') {
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        dateFilter = { 'paymentHistory.date': { $gte: lastMonth } };
      } else if (period === 'year') {
        const lastYear = new Date(now);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        dateFilter = { 'paymentHistory.date': { $gte: lastYear } };
      }
      
      // Aggregate subscription earnings
      const earnings = await Subscription.aggregate([
        { 
          $match: { 
            creator: mongoose.Types.ObjectId(creatorId),
            ...dateFilter
          }
        },
        {
          $unwind: '$paymentHistory'
        },
        {
          $match: {
            'paymentHistory.status': 'completed',
            ...(dateFilter['paymentHistory.date'] ? { 'paymentHistory.date': dateFilter['paymentHistory.date'] } : {})
          }
        },
        {
          $group: {
            _id: {
              month: { $month: '$paymentHistory.date' },
              year: { $year: '$paymentHistory.date' }
            },
            totalAmount: { $sum: '$paymentHistory.amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1
          }
        }
      ]);
      
      // Calculate totals
      const totalRevenue = earnings.reduce((sum, item) => sum + item.totalAmount, 0);
      const totalTransactions = earnings.reduce((sum, item) => sum + item.count, 0);
      
      return res.status(200).json({
        success: true,
        earnings: {
          detail: earnings,
          totalRevenue,
          totalTransactions
        }
      });
    } catch (error) {
      console.error('Error getting subscription earnings:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  
  // Process subscription payment (simulate a payment processor webhook)
  processPayment: async (req, res) => {
    try {
      const { subscriptionId, amount, transactionId } = req.body;
      
      if (!subscriptionId || !amount || !transactionId) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ success: false, message: 'Subscription not found' });
      }
      
      // Add to payment history
      subscription.paymentHistory.push({
        transactionId,
        amount,
        currency: subscription.currency,
        status: 'completed',
        date: new Date()
      });
      
      // Update next billing date
      const nextBillingDate = new Date(subscription.nextBillingDate);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      subscription.nextBillingDate = nextBillingDate;
      
      // Update end date
      subscription.endDate = nextBillingDate;
      
      await subscription.save();
      
      return res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        subscription
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

module.exports = subscriptionController;