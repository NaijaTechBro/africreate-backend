const mongoose = require('mongoose');
const Profile = require('../models/profileModel');
const asyncHandler = require('express-async-handler');



// Get the current user's profile
const getMyProfile = asyncHandler(async (req, res) => {
    try {
        // This assumes that req.user is set by your authentication middleware
        // and contains the current user's ID
        const profile = await Profile.findOne({ userId: req.user._id });
        
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all profiles
const getProfiles = async (req, res) => { 
    try {
        const allProfiles = await Profile.find().sort({ _id: -1 });
        res.status(200).json(allProfiles);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get a single profile by ID
const getProfile = async (req, res) => { 
    const { id } = req.params;

    try {
        const profile = await Profile.findById(id);
        res.status(200).json(profile);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Create a new profile
const createProfile = async (req, res) => {
    const {
        name,
        phoneNumber,
        photo,
        userId,
    } = req.body;

    const newProfile = new Profile({
        name,
        phoneNumber,
        photo,
        userId,
        createdAt: new Date().toISOString() 
    });

    try {
        // Note: The original code referenced 'email' but it wasn't defined in the function parameters
        // Fixed here by checking the userId instead
        const existingProfile = await Profile.findOne({ userId });

        if(existingProfile) return res.status(404).json({ message: "Profile already exists" });
        
        await newProfile.save();
        res.status(201).json(newProfile);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

// Get profile by user ID
const getProfilesByUser = async (req, res) => {
    const { searchQuery } = req.query;

    try {
        const profile = await Profile.findOne({ userId: searchQuery });
        res.json({ data: profile });
    } catch (error) {    
        res.status(404).json({ message: error.message });
    }
};

// Search profiles by name or email
const getProfilesBySearch = async (req, res) => {
    const { searchQuery } = req.query;

    try {
        const name = new RegExp(searchQuery, "i");
        const email = new RegExp(searchQuery, "i");

        const profiles = await Profile.find({ $or: [{ name }, { email }] });
        res.json({ data: profiles });
    } catch (error) {    
        res.status(404).json({ message: error.message });
    }
};

// Update profile
const updateProfile = async (req, res) => {
    const { id: _id } = req.params;
    const profile = req.body;

    if(!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No client with that id');

    const updatedProfile = await Profile.findByIdAndUpdate(_id, {...profile, _id}, { new: true });
    res.json(updatedProfile);
};

// Delete profile
const deleteProfile = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No profile with id: ${id}`);

    await Profile.findByIdAndRemove(id);
    res.json({ message: "Profile deleted successfully." });
};

module.exports = {
    getProfiles,
    getProfile,
    createProfile,
    getMyProfile,
    getProfilesByUser,
    getProfilesBySearch,
    updateProfile,
    deleteProfile
};