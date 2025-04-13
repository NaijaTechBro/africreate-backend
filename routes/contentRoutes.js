const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');


// Get content categories
router.get('/categories', contentController.getCategories);//

// Get popular creators
router.get('/popular-creators', contentController.getPopularCreators);//

// Get trending content
router.get('/trending', contentController.getTrendingContent);//

// Get content by creator (protected route)
router.get('/creator/me', contentController.getCreatorContent);//

// Create new content (protected, creator only)
router.post('/create-content', isAuthenticatedUser, contentController.createContent);//

// Routes with contentId parameter
// Like content (protected route)
router.post('/:contentId/like', isAuthenticatedUser, contentController.likeContent);//

// Unlike content (protected route)
router.delete('/:contentId/unlike', isAuthenticatedUser, contentController.unlikeContent);//

// Add comment to content (protected route)
router.post('/:contentId/comment', isAuthenticatedUser, contentController.addComment);//

// Get comments for content
router.get('/:contentId/comments', contentController.getComments);//

// Get single content by ID (optional auth for checking subscriptions)
router.get('/:contentId', contentController.getContent);//

// Update content (protected, creator only)
router.put('/:contentId', isAuthenticatedUser, contentController.updateContent);//

// Delete content (protected, creator only)
router.delete('/:contentId', isAuthenticatedUser, contentController.deleteContent);//

//get creator stats
router.get('/creator/stats', isAuthenticatedUser, contentController.getCreatorStats);
module.exports = router;