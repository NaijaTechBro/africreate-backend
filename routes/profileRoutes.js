const express = require('express');
const router = express.Router()


const { getProfiles, createProfile, updateProfile, deleteProfile, getProfile, getProfilesByUser } = require("../controllers/profileController")
const { 
    updateProfilePicture, 
    deleteProfilePicture, 
    uploadMiddleware 
  } = require("../utils/profilePicture");
  const { isAuthenticatedUser } = require("../middleware/authMiddleware");


router.get('/me', getProfile)
router.get('/profile/getprofiles', getProfiles)
router.get('/profile/getprofilebyuser/', getProfilesByUser)
router.post('/profile/create', createProfile)
router.patch('/profile/update/:id', updateProfile)
router.delete('/profile/delete/:id', deleteProfile)


// Update profile picture - uses the Cloudinary upload middleware
router.put("/update", isAuthenticatedUser, uploadMiddleware, updateProfilePicture);

// Delete profile picture
router.delete("/delete", isAuthenticatedUser, deleteProfilePicture);

module.exports = router;