const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

// Get current user data
const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    
    if (user) {
        const { _id, name, email, photo, phone, isVerified, role, vToken } = user;
        res.status(200).json({
            _id,
            name,
            email,
            photo,
            phone,
            isVerified,
            role,
            vToken,
        });
    } else {
        res.status(400);
        throw new Error("User Not Found");
    }
});

// Update user details
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    
    if (user) {
        const { name, email, photo, phone, role, isVerified } = user;
        user.email = email;
        user.name = req.body.name || name;
        user.phone = req.body.phone || phone;
        user.photo = req.body.photo || photo;
        
        const updatedUser = await user.save();
        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            photo: updatedUser.photo,
            phone: updatedUser.phone,
            role,
            isVerified,
        });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});

// Get all users - admin function
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().sort("-createdAt").select("-password");
    if (!users) {
        res.status(500);
        throw new Error("Something went wrong");
    }
    res.status(200).json(users);
});

// Delete a user - admin function
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    // if user doesnt exist
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    
    await user.remove();
    res.status(200).json({ message: "User deleted successfully" });
});

// Upgrade user role - admin function
const upgradeUser = asyncHandler(async (req, res) => {
    const { role, id } = req.body;
    
    // Get the user
    const user = await User.findById(id);
    
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    
    user.role = role;
    await user.save();
    
    res.status(200).json(`User role updated to ${role}`);
});

// Special function to delete all records - admin only and should be protected
const deleteAll = asyncHandler(async (req, res) => {
    // await Token.deleteMany({});
    res.send("Encrypt");
    // const crypted = encrypt(content);
    // const decrypted = decrypt(crypted);
});

module.exports = {
    getUser,
    updateUser,
    getUsers,
    upgradeUser,
    deleteUser,
    deleteAll,
};