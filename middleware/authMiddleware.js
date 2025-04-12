const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const isAuthenticatedUser = asyncHandler (async (req, res, next) => {
    try {
        const token = req.cookies.token
        if (!token) {
            res.status(401)
            throw new Error("Not authorised, please login")
        }

        // Verify Token
        const verified = jwt.verify(token, process.env.MY_SECRET)
        // Get user id from token
        const user = await User.findById(verified.id).select("-password")
        
        if (!user) {
            res.status(401)
            throw new Error("User not found");
        }
        if (user.role === "suspended") {
            res.status(400);
            throw new Error("User has been suspended, please contact support")
        }
        req.user = user
        next()
    } catch (error) {
        res.status(401)
        throw new Error("Not authorised, please login")
    }
});

const verifiedOnly = (req, res, next) => {
    if (req.user && req.user.isVerified) {
        next();
    } else {
        res.status(401);
        throw new Error("Not authorized, account not verified");
    }
    };

    const businessOnly = (req, res, next) => {
    if (req.user.role === "business" || req.user.role === "admin") {
        next();
    } else {
        res.status(401);
        throw new Error("Not authorized as an business");
    }
    };

    const clientOnly = (req, res, next) => {
        if (req.user.role === "client" || req.user.role === "admin") {
            next();
        } else {
            res.status(401);
            throw new Error("Not authorized as an client");
        }
        };

    const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(401);
        throw new Error("Not authorized as an admin");
    }
    };


// const authorizeRoles = (roles) => {
//     return (req, res, next) => {
//         if(!roles.includes(req.user.role)) {
//             return res.json({
//                 message: `${req.user.role} is not allowed to access to this resource`
//             })
//         }
//         next();
//     };

// };

module.exports = {
    isAuthenticatedUser,
    adminOnly,
    verifiedOnly,
    businessOnly,
    clientOnly,
    // authorizeRoles,

}