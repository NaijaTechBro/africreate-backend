const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_pictures',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [
      { width: 500, height: 500, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB file size limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}).single('profilePicture'); // Name of the form field

// Middleware for handling file uploads
const uploadMiddleware = (req, res, next) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred during upload
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({ success: false, message: err.message });
    }
    // Everything went fine
    next();
  });
};

// Update profile picture
const updateProfilePicture = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload an image file" });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // If user already has a profile picture, delete the old one from Cloudinary
    if (user.profilePicture && user.profilePicture.includes('cloudinary')) {
      try {
        // Extract the public_id from the URL
        const publicId = user.profilePicture.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);
      } catch (deleteErr) {
        console.error("Error deleting old image:", deleteErr);
        // Continue with upload even if delete fails
      }
    }
    
    // Update with new image URL
    user.profilePicture = req.file.path; // Cloudinary URL from multer-storage-cloudinary
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

// Delete profile picture
const deleteProfilePicture = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    if (!user.profilePicture) {
      return res.status(400).json({ success: false, message: "No profile picture to delete" });
    }
    
    // If the image is stored in cloudinary
    if (user.profilePicture.includes('cloudinary')) {
      try {
        // Extract the public_id from the URL
        const publicId = user.profilePicture.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);
      } catch (err) {
        console.error("Error deleting image from Cloudinary:", err);
      }
    }
    
    // Set profile picture to default or null
    user.profilePicture = null;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully"
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = {
  updateProfilePicture,
  deleteProfilePicture,
  uploadMiddleware
};