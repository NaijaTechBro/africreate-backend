const express = require("express")
const router = express.Router();
const { isAuthenticatedUser } = require('../middleware/authMiddleware');
const { refetch, register, resetPassword, loginStatus, forgotPassword, login, logout } = require("../controllers/authController")

// Routes
router.post("/register", register)
router.post("/login", login)
router.post("/logout", logout)
router.get("/loginStatus", loginStatus)

router.post("/forgotPassword", forgotPassword)
router.patch("/resetPassword/:resetToken", resetPassword)
router.get("/refetch", refetch)

module.exports = router