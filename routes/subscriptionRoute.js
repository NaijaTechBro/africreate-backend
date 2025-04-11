const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');

// Get user's subscriptions (protected route)
router.get('/user', isAuthenticatedUser, subscriptionController.getUserSubscriptions);

// Get creator's subscribers (protected route)
router.get('/creator', isAuthenticatedUser, subscriptionController.getCreatorSubscriptions);

// Check if user is subscribed to creator (protected route)
router.get('/check/:creatorId', isAuthenticatedUser, subscriptionController.checkSubscription);

// Subscribe to creator (protected route)
router.post('/subscribe', isAuthenticatedUser, subscriptionController.subscribe);

module.exports = router;