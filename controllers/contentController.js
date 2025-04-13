// const Content = require('../models/contentModel');
// const User = require('../models/userModel');
// const Subscription = require('../models/subscriptionModel');

// // Controller methods for content-related operations
// const contentController = {
//   // Create new content
//   createContent: async (req, res) => {
//     try {
//       const userId = req.user._id;
      
//       // Check if user exists and is a creator
//       const user = await User.findById(userId);
//       if (!user || !user.isCreator) {
//         return res.status(403).json({ 
//           success: false, 
//           message: 'Only creators can publish content' 
//         });
//       }
      
//       const { 
//         title, 
//         description, 
//         contentType, 
//         mediaUrl, 
//         thumbnailUrl, 
//         tags, 
//         isExclusive, 
//         requiredTier, 
//         isPaidContent, 
//         price, 
//         currency,
//         status,
//         scheduleDate
//       } = req.body;
      
//       // Validate required fields
//       if (!title || !contentType) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'Title and content type are required' 
//         });
//       }
      
//       // Additional validation based on content type
//       if (['image', 'video', 'audio'].includes(contentType) && !mediaUrl) {
//         return res.status(400).json({ 
//           success: false, 
//           message: `Media URL is required for ${contentType} content` 
//         });
//       }
      
//       // Create new content
//       const newContent = new Content({
//         creator: userId,
//         title,
//         description,
//         contentType,
//         mediaUrl,
//         thumbnailUrl,
//         tags: tags?.length ? tags : [],
//         isExclusive: isExclusive || false,
//         requiredTier: requiredTier || null,
//         isPaidContent: isPaidContent || false,
//         price: price || 0,
//         currency: currency || 'USD',
//         status: status || 'published',
//         scheduleDate: scheduleDate || null
//       });
      
//       await newContent.save();
      
//       // Populate creator info for response
//       const populatedContent = await Content.findById(newContent._id)
//         .populate('creator', 'username profilePicture');
      
//       return res.status(201).json({
//         success: true,
//         message: 'Content created successfully',
//         content: populatedContent
//       });
//     } catch (error) {
//       console.error('Error creating content:', error);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//   },

//   // Update content
//   updateContent: async (req, res) => {
//     try {
//       const contentId = req.params.contentId;
//       const userId = req.user._id;
      
//       // Find content
//       const content = await Content.findById(contentId);
      
//       if (!content) {
//         return res.status(404).json({ success: false, message: 'Content not found' });
//       }
      
//       // Check if user is the creator
//       if (content.creator.toString() !== userId.toString()) {
//         return res.status(403).json({ 
//           success: false, 
//           message: 'You can only update your own content' 
//         });
//       }
      
//       // Update fields if provided
//       const updateFields = [
//         'title', 'description', 'mediaUrl', 'thumbnailUrl', 
//         'tags', 'isExclusive', 'requiredTier', 'isPaidContent', 
//         'price', 'currency', 'status', 'scheduleDate'
//       ];
      
//       updateFields.forEach(field => {
//         if (req.body[field] !== undefined) {
//           content[field] = req.body[field];
//         }
//       });
      
//       // Save updated content
//       await content.save();
      
//       // Populate creator info for response
//       const populatedContent = await Content.findById(contentId)
//         .populate('creator', 'username profilePicture');
      
//       return res.status(200).json({
//         success: true,
//         message: 'Content updated successfully',
//         content: populatedContent
//       });
//     } catch (error) {
//       console.error('Error updating content:', error);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//   },

//   // Delete content
//   deleteContent: async (req, res) => {
//     try {
//       const contentId = req.params.contentId;
//       const userId = req.user._id;
      
//       // Find content
//       const content = await Content.findById(contentId);
      
//       if (!content) {
//         return res.status(404).json({ success: false, message: 'Content not found' });
//       }
      
//       // Check if user is the creator
//       if (content.creator.toString() !== userId.toString()) {
//         return res.status(403).json({ 
//           success: false, 
//           message: 'You can only delete your own content' 
//         });
//       }
      
//       // Delete content
//       await Content.findByIdAndDelete(contentId);
      
//       return res.status(200).json({
//         success: true,
//         message: 'Content deleted successfully'
//       });
//     } catch (error) {
//       console.error('Error deleting content:', error);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//   },

//   // Get popular creators
//   getPopularCreators: async (req, res) => {
//     try {
//       // Find creators with most followers or most content views
//       const popularCreators = await User.aggregate([
//         // Match only users who are creators
//         { $match: { isCreator: true } },
        
//         // Add followers count field
//         { $addFields: { 
//           followersCount: { $size: { $ifNull: ["$followers", []] } } 
//         }},
        
//         // Optional: Lookup content for each creator to count views
//         { $lookup: {
//           from: 'contents',
//           localField: '_id',
//           foreignField: 'creator',
//           as: 'contents'
//         }},
        
//         // Add total views field
//         { $addFields: {
//           totalViews: { $sum: "$contents.views" }
//         }},
        
//         // Project only needed fields
//         { $project: {
//           _id: 1,
//           name: 1,
//           username: 1,
//           profilePicture: 1,
//           bio: 1,
//           followersCount: 1,
//           totalViews: 1,
//           contentCount: { $size: "$contents" }
//         }},
        
//         // Sort by combination of followers and views
//         { $sort: { 
//           followersCount: -1, 
//           totalViews: -1 
//         }},
        
//         // Limit to top 10 creators
//         { $limit: 10 }
//       ]);
      
//       return res.status(200).json({
//         success: true,
//         creators: popularCreators
//       });
//     } catch (error) {
//       console.error('Error getting popular creators:', error);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//   },

//   // Get single content by ID
// getContent: async (req, res) => {
//   try {
//     const contentId = req.params.contentId;
    
//     // Validate if contentId is a valid ObjectId
//     if (!mongoose.Types.ObjectId.isValid(contentId)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid content ID format' 
//       });
//     }
    
//     const content = await Content.findById(contentId)
//       .populate('creator', 'username profilePicture')
//       .populate({
//         path: 'comments',
//         populate: {
//           path: 'user',
//           select: 'username profilePicture'
//         }
//       });

//     if (!content) {
//       return res.status(404).json({ success: false, message: 'Content not found' });
//     }

//     // Check if content is exclusive and user has subscription
//     if (content.isExclusive) {
//       // If no user is logged in
//       if (!req.user) {
//         return res.status(403).json({ 
//           success: false, 
//           message: 'This content requires a subscription' 
//         });
//       }

//       // Check if user is the creator
//       if (content.creator._id.toString() !== req.user._id.toString()) {
//         // Check if user has active subscription
//         const hasSubscription = await Subscription.findOne({
//           subscriber: req.user._id,
//           creator: content.creator._id,
//           isActive: true,
//           ...(content.requiredTier && { tier: content.requiredTier })
//         });

//         if (!hasSubscription) {
//           return res.status(403).json({ 
//             success: false, 
//             message: 'This content requires a subscription' 
//           });
//         }
//       }
//     }

//     // Increment view count
//     content.views += 1;
//     await content.save();

//     return res.status(200).json({
//       success: true,
//       content
//     });
//   } catch (error) {
//     console.error('Error getting content:', error);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// },

//   // Get trending content
//   getTrendingContent: async (req, res) => {
//     try {
//       const { category } = req.query;
      
//       // Base query for public content
//       let query = { status: 'published', isExclusive: false };
      
//       // Add category filter if provided
//       if (category) {
//         query.category = category;
//       }

//       const contents = await Content.find(query)
//         .sort({ views: -1, 'likes.length': -1, createdAt: -1 })
//         .limit(12)
//         .populate('creator', 'username profilePicture');

//       return res.status(200).json({
//         success: true,
//         contents
//       });
//     } catch (error) {
//       console.error('Error getting trending content:', error);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//   },

//   // Get content by creator
//   getCreatorContent: async (req, res) => {
//     try {
//       const creatorId = req.user._id; // Get content for logged in user
      
//       const contents = await Content.find({ creator: creatorId })
//         .sort({ createdAt: -1 })
//         .populate('creator', 'username profilePicture');

//       return res.status(200).json({
//         success: true,
//         contents
//       });
//     } catch (error) {
//       console.error('Error getting creator content:', error);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//   },

//   // Get content categories
//   getCategories: async (req, res) => {
//     try {
//       // Get unique categories from content
//       const categories = await Content.distinct('category');
      
//       // Filter out nulls and empty values
//       const validCategories = categories.filter(category => category);

//       return res.status(200).json({
//         success: true,
//         categories: validCategories
//       });
//     } catch (error) {
//       console.error('Error getting categories:', error);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//   },

//   // Like content
//   likeContent: async (req, res) => {
//     try {
//       const contentId = req.params.contentId;
//       const userId = req.user._id;

//       const content = await Content.findById(contentId);
      
//       if (!content) {
//         return res.status(404).json({ success: false, message: 'Content not found' });
//       }

//       // Check if user already liked the content
//       if (content.likes.includes(userId)) {
//         return res.status(400).json({ success: false, message: 'Content already liked' });
//       }

//       // Add user to likes array
//       content.likes.push(userId);
//       await content.save();

//       return res.status(200).json({
//         success: true,
//         message: 'Content liked successfully'
//       });
//     } catch (error) {
//       console.error('Error liking content:', error);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//   },

//   // Unlike content
//   unlikeContent: async (req, res) => {
//     try {
//       const contentId = req.params.contentId;
//       const userId = req.user._id;

//       const content = await Content.findById(contentId);
      
//       if (!content) {
//         return res.status(404).json({ success: false, message: 'Content not found' });
//       }

//       // Check if user has liked the content
//       if (!content.likes.includes(userId)) {
//         return res.status(400).json({ success: false, message: 'Content not liked' });
//       }

//       // Remove user from likes array
//       content.likes = content.likes.filter(id => id.toString() !== userId.toString());
//       await content.save();

//       return res.status(200).json({
//         success: true,
//         message: 'Content unliked successfully'
//       });
//     } catch (error) {
//       console.error('Error unliking content:', error);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//   },

//   // Add comment to content
//   addComment: async (req, res) => {
//     try {
//       const contentId = req.params.contentId;
//       const userId = req.user._id;
//       const { text } = req.body;

//       if (!text || !text.trim()) {
//         return res.status(400).json({ success: false, message: 'Comment text is required' });
//       }

//       const content = await Content.findById(contentId);
      
//       if (!content) {
//         return res.status(404).json({ success: false, message: 'Content not found' });
//       }

//       // Create new comment
//       const newComment = {
//         user: userId,
//         text,
//         createdAt: new Date()
//       };

//       // Add comment to content
//       content.comments.unshift(newComment);
//       await content.save();

//       // Get populated comment for response
//       const populatedContent = await Content.findById(contentId).populate({
//         path: 'comments.user',
//         select: 'username profilePicture'
//       });

//       const comment = populatedContent.comments[0];

//       return res.status(201).json({
//         success: true,
//         comment
//       });
//     } catch (error) {
//       console.error('Error adding comment:', error);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//   },

//   // Get comments for content
//   getComments: async (req, res) => {
//     try {
//       const contentId = req.params.contentId;

//       const content = await Content.findById(contentId).populate({
//         path: 'comments.user',
//         select: 'username profilePicture'
//       });
      
//       if (!content) {
//         return res.status(404).json({ success: false, message: 'Content not found' });
//       }

//       return res.status(200).json({
//         success: true,
//         comments: content.comments
//       });
//     } catch (error) {
//       console.error('Error getting comments:', error);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//   }
// };

// module.exports = contentController;const Content = require('../models/contentModel');
const User = require('../models/userModel');
const Subscription = require('../models/subscriptionModel');
const mongoose = require('mongoose'); // Added for ObjectId validation

// Controller methods for content-related operations
const contentController = {
  // Create new content
  createContent: async (req, res) => {
    try {
      const userId = req.user._id;
      
      // Check if user exists and is a creator
      const user = await User.findById(userId);
      if (!user || !user.isCreator) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only creators can publish content' 
        });
      }
      
      const { 
        title, 
        description, 
        contentType, 
        mediaUrl, 
        thumbnailUrl, 
        tags, 
        isExclusive, 
        requiredTier, 
        isPaidContent, 
        price, 
        currency,
        status,
        scheduleDate
      } = req.body;
      
      // Validate required fields
      if (!title || !contentType) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title and content type are required' 
        });
      }
      
      // Additional validation based on content type
      if (['image', 'video', 'audio'].includes(contentType) && !mediaUrl) {
        return res.status(400).json({ 
          success: false, 
          message: `Media URL is required for ${contentType} content` 
        });
      }
      
      // Create new content
      const newContent = new Content({
        creator: userId,
        title,
        description,
        contentType,
        mediaUrl,
        thumbnailUrl,
        tags: tags?.length ? tags : [],
        isExclusive: isExclusive || false,
        requiredTier: requiredTier || null,
        isPaidContent: isPaidContent || false,
        price: price || 0,
        currency: currency || 'USD',
        status: status || 'published',
        scheduleDate: scheduleDate || null
      });
      
      await newContent.save();
      
      // Populate creator info for response
      const populatedContent = await Content.findById(newContent._id)
        .populate('creator', 'username profilePicture');
      
      return res.status(201).json({
        success: true,
        message: 'Content created successfully',
        content: populatedContent
      });
    } catch (error) {
      console.error('Error creating content:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Update content
  updateContent: async (req, res) => {
    try {
      const contentId = req.params.contentId;
      const userId = req.user._id;
      
      // Find content
      const content = await Content.findById(contentId);
      
      if (!content) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }
      
      // Check if user is the creator
      if (content.creator.toString() !== userId.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only update your own content' 
        });
      }
      
      // Update fields if provided
      const updateFields = [
        'title', 'description', 'mediaUrl', 'thumbnailUrl', 
        'tags', 'isExclusive', 'requiredTier', 'isPaidContent', 
        'price', 'currency', 'status', 'scheduleDate'
      ];
      
      updateFields.forEach(field => {
        if (req.body[field] !== undefined) {
          content[field] = req.body[field];
        }
      });
      
      // Save updated content
      await content.save();
      
      // Populate creator info for response
      const populatedContent = await Content.findById(contentId)
        .populate('creator', 'username profilePicture');
      
      return res.status(200).json({
        success: true,
        message: 'Content updated successfully',
        content: populatedContent
      });
    } catch (error) {
      console.error('Error updating content:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Delete content
  deleteContent: async (req, res) => {
    try {
      const contentId = req.params.contentId;
      const userId = req.user._id;
      
      // Find content
      const content = await Content.findById(contentId);
      
      if (!content) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }
      
      // Check if user is the creator
      if (content.creator.toString() !== userId.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only delete your own content' 
        });
      }
      
      // Delete content
      await Content.findByIdAndDelete(contentId);
      
      return res.status(200).json({
        success: true,
        message: 'Content deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Get popular creators
  getPopularCreators: async (req, res) => {
    try {
      // Find creators with most followers or most content views
      const popularCreators = await User.aggregate([
        // Match only users who are creators
        { $match: { isCreator: true } },
        
        // Add followers count field
        { $addFields: { 
          followersCount: { $size: { $ifNull: ["$followers", []] } } 
        }},
        
        // Optional: Lookup content for each creator to count views
        { $lookup: {
          from: 'contents',
          localField: '_id',
          foreignField: 'creator',
          as: 'contents'
        }},
        
        // Add total views field
        { $addFields: {
          totalViews: { $sum: "$contents.views" }
        }},
        
        // Project only needed fields
        { $project: {
          _id: 1,
          name: 1,
          username: 1,
          profilePicture: 1,
          bio: 1,
          followersCount: 1,
          totalViews: 1,
          contentCount: { $size: "$contents" }
        }},
        
        // Sort by combination of followers and views
        { $sort: { 
          followersCount: -1, 
          totalViews: -1 
        }},
        
        // Limit to top 10 creators
        { $limit: 10 }
      ]);
      
      return res.status(200).json({
        success: true,
        creators: popularCreators
      });
    } catch (error) {
      console.error('Error getting popular creators:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Get single content by ID
  getContent: async (req, res) => {
    try {
      const contentId = req.params.contentId;
      
      // Validate if contentId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid content ID format' 
        });
      }
      
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
  },

  // NEW METHOD: Get creator stats
  getCreatorStats: async (req, res) => {
    try {
      const creatorId = req.user._id;
      
      // Verify user is a creator
      const user = await User.findById(creatorId);
      if (!user || !user.isCreator) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized as creator' 
        });
      }
      
      // Get content count and total views
      const contentStats = await Content.aggregate([
        { $match: { creator: mongoose.Types.ObjectId(creatorId) } },
        { $group: {
          _id: null,
          totalContent: { $sum: 1 },
          totalViews: { $sum: '$views' }
        }}
      ]);
      
      // Get subscription count and revenue
      const subscriptionStats = await Subscription.aggregate([
        { $match: { 
          creator: mongoose.Types.ObjectId(creatorId),
          isActive: true
        }},
        { $group: {
          _id: null,
          totalSubscribers: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }}
      ]);
      
      // Extract values or set defaults
      const totalContent = contentStats.length > 0 ? contentStats[0].totalContent : 0;
      const totalViews = contentStats.length > 0 ? contentStats[0].totalViews : 0;
      const totalSubscribers = subscriptionStats.length > 0 ? subscriptionStats[0].totalSubscribers : 0;
      const totalRevenue = subscriptionStats.length > 0 ? subscriptionStats[0].totalRevenue : 0;
      
      return res.status(200).json({
        success: true,
        stats: {
          totalContent,
          totalViews,
          totalSubscribers,
          totalRevenue
        }
      });
    } catch (error) {
      console.error('Error getting creator stats:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

module.exports = contentController;


