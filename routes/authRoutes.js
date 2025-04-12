const express = require("express");
const router = express.Router();
const {
    register,
    login,
    logout,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    verifyUser,
    sendAutomatedEmail,
} = require("../controllers/authController");
const {
    isAuthenticatedUser,
} = require("../middleware/authMiddleware");
const loginLimiter = require("../middleware/loginLimiter");

router.post("/auth/register", register);
router.post("/auth/sendVerificationEmail", isAuthenticatedUser, sendVerificationEmail);
router.patch("/auth/verifyUser/:verificationToken", verifyUser);
router.post("/auth/login", loginLimiter, login);
router.get("/logout", logout);

router.post("/sendAutomatedEmail", isAuthenticatedUser, sendAutomatedEmail);

router.get("/auth/loginStatus", loginStatus);
router.patch("/auth/updateUser", isAuthenticatedUser, updateUser);
router.patch("/auth/changePassword", isAuthenticatedUser, changePassword);
router.post("/auth/forgotPassword", forgotPassword);
router.patch("/auth/resetPassword/:resetToken", resetPassword);


module.exports = router;