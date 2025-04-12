const express = require("express");
const router = express.Router();
const {
    getUser,
    updateUser,
    getUsers,
    deleteUser,
    upgradeUser,
    deleteAll,
} = require("../controllers/userController");
const {
    isAuthenticatedUser,
    businessOnly,
    adminOnly,
} = require("../middleware/authMiddleware");
const loginLimiter = require("../middleware/loginLimiter");


// Admin Route
router.get("/users/getUser/:id", isAuthenticatedUser, getUser);
router.patch("/users/updateUser", isAuthenticatedUser, updateUser);
router.get("/users/getUsers", isAuthenticatedUser, businessOnly, getUsers);
router.post("/users/delete/:id", deleteAll);
router.delete("/admin/:id", isAuthenticatedUser, adminOnly, deleteUser);
router.patch("/admin/upgrade", isAuthenticatedUser, adminOnly, upgradeUser);


module.exports = router;