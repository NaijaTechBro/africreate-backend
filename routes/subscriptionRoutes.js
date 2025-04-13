const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');

// Get user's subscriptions (protected route)
router.get('/user/subscriptions', isAuthenticatedUser, subscriptionController.getUserSubscriptions);

// Get creator's subscribers (protected route)
router.get('/creator/subscribers', isAuthenticatedUser, subscriptionController.getCreatorSubscriptions);

// Check if user is subscribed to creator (protected route)
router.get('/check/:creatorId', isAuthenticatedUser, subscriptionController.checkSubscription);

// Subscribe to creator (protected route)
router.post('/subscribe', isAuthenticatedUser, subscriptionController.subscribe);

// Cancel subscription (protected route)
router.put('/cancel/:subscriptionId', isAuthenticatedUser, subscriptionController.cancelSubscription);

// Get subscription earnings (protected route for creators)
router.get('/earnings', isAuthenticatedUser, subscriptionController.getSubscriptionEarnings);

// Process subscription payment (webhook route)
router.post('/process-payment', subscriptionController.processPayment);

module.exports = router;