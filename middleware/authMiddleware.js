const asyncHandler = require("express-async-handler")
const User = require("../models/userModel")
const jwt = require("jsonwebtoken")

const isAuthenticatedUser = asyncHandler(async (req, res, next) => {
	try {
		const token = req.cookies.token
		if (!token) {
			res.status(401)
			throw new Error("Not authorised, please login")
		}

		// Verify Token
		const verified = jwt.verify(token, process.env.SECRET)
		// Get user id from token
		const user = await User.findById(verified.id).select("-password")

		if (!user) {
			res.status(401)
			throw new Error("User not found")
		}
		if (user.role === "suspended") {
			res.status(400)
			throw new Error("User has been suspended, please contact support")
		}
		req.user = user
		next()
	} catch (error) {
		res.status(401)
		throw new Error("Not authorised, please login")
	}
})

module.exports = {
	isAuthenticatedUser,
}