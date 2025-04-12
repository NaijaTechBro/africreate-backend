const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');

// Get single content by ID (optional auth for checking subscriptions)
router.get('/:contentId', contentController.getContent);

// Get trending content
router.get('/trending', contentController.getTrendingContent);

// Get content by creator (protected route)
router.get('/creator', isAuthenticatedUser, contentController.getCreatorContent);

// Get content categories
router.get('/categories', contentController.getCategories);

// Like content (protected route)
router.post('/:contentId/like', isAuthenticatedUser, contentController.likeContent);

// Unlike content (protected route)
router.delete('/:contentId/unlike', isAuthenticatedUser, contentController.unlikeContent);

// Add comment to content (protected route)
router.post('/:contentId/comment', isAuthenticatedUser, contentController.addComment);

// Get comments for content
router.get('/:contentId/comments', contentController.getComments);

module.exports = router;