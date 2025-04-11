const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');

// Get user profile by username
router.get('/:username', userController.getProfile);

// Get popular creators
router.get('/popular-creators', userController.getPopularCreators);

// Get creator stats (protected route)
router.get('/creator/stats', isAuthenticatedUser ,userController.getCreatorStats);

module.exports = router;