const Content = require('../models/contentModel');
const User = require('../models/userModel');
const Subscription = require('../models/subscriptionModel');

// Controller methods for content-related operations
const contentController = {
  // Get single content by ID
  getContent: async (req, res) => {
    try {
      const contentId = req.params.contentId;
      const content = await Content.findById(contentId)
        .populate('creator', 'username profilePicture')
        .populate({
          path: 'comments',
          populate: {
            path: 'user',
            select: 'username profilePicture'
          }
        });

      if (!content) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }

      // Check if content is exclusive and user has subscription
      if (content.isExclusive) {
        // If no user is logged in
        if (!req.user) {
          return res.status(403).json({ 
            success: false, 
            message: 'This content requires a subscription' 
          });
        }

        // Check if user is the creator
        if (content.creator._id.toString() !== req.user._id.toString()) {
          // Check if user has active subscription
          const hasSubscription = await Subscription.findOne({
            subscriber: req.user._id,
            creator: content.creator._id,
            isActive: true,
            ...(content.requiredTier && { tier: content.requiredTier })
          });

          if (!hasSubscription) {
            return res.status(403).json({ 
              success: false, 
              message: 'This content requires a subscription' 
            });
          }
        }
      }

      // Increment view count
      content.views += 1;
      await content.save();

      return res.status(200).json({
        success: true,
        content
      });
    } catch (error) {
      console.error('Error getting content:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Get trending content
  getTrendingContent: async (req, res) => {
    try {
      const { category } = req.query;
      
      // Base query for public content
      let query = { status: 'published', isExclusive: false };
      
      // Add category filter if provided
      if (category) {
        query.category = category;
      }

      const contents = await Content.find(query)
        .sort({ views: -1, 'likes.length': -1, createdAt: -1 })
        .limit(12)
        .populate('creator', 'username profilePicture');

      return res.status(200).json({
        success: true,
        contents
      });
    } catch (error) {
      console.error('Error getting trending content:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Get content by creator
  getCreatorContent: async (req, res) => {
    try {
      const creatorId = req.user._id; // Get content for logged in user
      
      const contents = await Content.find({ creator: creatorId })
        .sort({ createdAt: -1 })
        .populate('creator', 'username profilePicture');

      return res.status(200).json({
        success: true,
        contents
      });
    } catch (error) {
      console.error('Error getting creator content:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Get content categories
  getCategories: async (req, res) => {
    try {
      // Get unique categories from content
      const categories = await Content.distinct('category');
      
      // Filter out nulls and empty values
      const validCategories = categories.filter(category => category);

      return res.status(200).json({
        success: true,
        categories: validCategories
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Like content
  likeContent: async (req, res) => {
    try {
      const contentId = req.params.contentId;
      const userId = req.user._id;

      const content = await Content.findById(contentId);
      
      if (!content) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }

      // Check if user already liked the content
      if (content.likes.includes(userId)) {
        return res.status(400).json({ success: false, message: 'Content already liked' });
      }

      // Add user to likes array
      content.likes.push(userId);
      await content.save();

      return res.status(200).json({
        success: true,
        message: 'Content liked successfully'
      });
    } catch (error) {
      console.error('Error liking content:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Unlike content
  unlikeContent: async (req, res) => {
    try {
      const contentId = req.params.contentId;
      const userId = req.user._id;

      const content = await Content.findById(contentId);
      
      if (!content) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }

      // Check if user has liked the content
      if (!content.likes.includes(userId)) {
        return res.status(400).json({ success: false, message: 'Content not liked' });
      }

      // Remove user from likes array
      content.likes = content.likes.filter(id => id.toString() !== userId.toString());
      await content.save();

      return res.status(200).json({
        success: true,
        message: 'Content unliked successfully'
      });
    } catch (error) {
      console.error('Error unliking content:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Add comment to content
  addComment: async (req, res) => {
    try {
      const contentId = req.params.contentId;
      const userId = req.user._id;
      const { text } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, message: 'Comment text is required' });
      }

      const content = await Content.findById(contentId);
      
      if (!content) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }

      // Create new comment
      const newComment = {
        user: userId,
        text,
        createdAt: new Date()
      };

      // Add comment to content
      content.comments.unshift(newComment);
      await content.save();

      // Get populated comment for response
      const populatedContent = await Content.findById(contentId).populate({
        path: 'comments.user',
        select: 'username profilePicture'
      });

      const comment = populatedContent.comments[0];

      return res.status(201).json({
        success: true,
        comment
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Get comments for content
  getComments: async (req, res) => {
    try {
      const contentId = req.params.contentId;

      const content = await Content.findById(contentId).populate({
        path: 'comments.user',
        select: 'username profilePicture'
      });
      
      if (!content) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }

      return res.status(200).json({
        success: true,
        comments: content.comments
      });
    } catch (error) {
      console.error('Error getting comments:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

module.exports = contentController;