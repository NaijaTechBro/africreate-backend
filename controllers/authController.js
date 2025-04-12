const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const parser = require("ua-parser-js");
const { hashToken, generateToken } = require("../utils");
const Cryptr = require("cryptr");
const { validationResult } = require('express-validator')

// Register User
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password, isCreator } = req.body;

  // Validation using express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  //Basic Validation
  if (!name || !email || !password || !username || !isCreator) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be up to 6 characters");
  }

  // Check if user email already exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] })

	if (userExists) {
		return res.status(400).json({ success: false, message: "User already exists." })
	}

  // Get User Device Details
  const ua = parser(req.headers["user-agent"]);
  const userAgent = [ua.ua];

  //   Create new user
  const user = await User.create({ 
    name, 
    email, 
    username, 
    password, 
    isCreator: isCreator || false, 
    userAgent 
  })


  //   Generate JWT Token
  const token = generateToken(user._id);

  // Send HTTP-only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: "none",
    secure: true,
  });
// Send welcome mail
const subject = "Welcome to Redox Trading";
const send_to = user.email;
const sent_from = "Redox Trading <info@redox.com.ng>";
const reply_to = "info@redox.com.ng"
const template = "welcome";
const fullname = user.name;

try {
  await sendEmail(
    subject,
    send_to,
    sent_from,
    reply_to,
    template,
    fullname,
  );
} catch (error) {
  console.log("Welcome email failed to send, but user was created successfully");
}

	if (user) {
		const { _id, name, email, photo, phone, isVerified, username, isCreator } = user
		return res.status(201).json({ 
			message: 'User registered successfully',
			token,
			user: {
				_id, 
				name, 
				username, 
				email, 
				photo, 
				phone,
        isVerified,
				isCreator
			}
		})
	} else {
		return res.status(400).json({ success: false, message: "Invalid user data" })
	}
})


// Login User
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Validate Request
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please add email and password" })
  }

  // Check if user exists
  const user = await User.findOne({ email })

  if (!user) {
    return res.status(400).json({ success: false, message: "User not found, please signup" })
  }

  // User exists, check if password is correct
  const passwordIsCorrect = await user.comparePassword(password)

  if (!passwordIsCorrect) {
    return res.status(400).json({ success: false, message: "Invalid email or password" })
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  // Trigger 2FA for unknown userAgent/device
  const ua = parser(req.headers["user-agent"])
  const thisUserAgent = ua.ua
  console.log(thisUserAgent)

  // Delete token if it exists in DB
  let userToken = await Token.findOne({ userId: user._id })
  if (userToken) {
    await userToken.deleteOne()

    // Save Access Token to DB
    await new Token({
      userId: user._id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60 * (60 * 1000), // One hour
    }).save()
  }

  //   Generate Token
  const token = generateToken(user._id)
  
  if (user && passwordIsCorrect) {
    // Send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: "none",
      secure: true,
    })

    const { _id, name, email, photo, phone, isVerified, role, isCreator, profilePicture } = user
    return res.status(200).json({ 
      message: 'Login successful',
      token,
      user: {
        _id, 
        name, 
        email, 
        photo, 
        phone, 
        isVerified, 
        role, 
        isCreator,
        profilePicture
      }
    })
  } else {
    return res.status(400).json({ success: false, message: "Something went wrong, please try again" })
  }
})

// Send Verification Email
const sendVerificationEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Check if user doesn't exists
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error("User already verified");
  }

  // Delete token if it exists in DB
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Create Verification Token and save
  const verificationToken = crypto.randomBytes(32).toString("hex") + user.id;

  // Hash token before saving to DB
  const hashedToken = hashToken(verificationToken);

  // Save Token to DB
  await new Token({
    userId: user._id,
    vToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * (60 * 1000), // Thirty minutes
  }).save();

  // Construct Verification Url
  const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;


  const subject = "Verify Your Account - Nestlypay";
  const send_to = user.email;
  const sent_from = "Nestlypay <hello@nestlypay.com>";
  const reply_to = "no-reply@nestlypay.com";
  const template = "email";
  const name = user.name;
  const link = verificationUrl;

  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      link
    );
    res.status(200).json({ success: true, message: "Verification Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});



// Verify User
const verifyUser = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  // Hash Token
  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // fIND tOKEN in DB
  const userToken = await Token.findOne({
    vToken: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token!!!");
  }
  // Find User
  const user = await User.findOne({ _id: userToken.userId });

  if (user.isVerified) {
    res.status(400);
    throw new Error("User is already verified!!!");
  }

  // Now Verify user
  user.isVerified = true;
  await user.save();

  res.status(200).json({
    message: "Account Verification Successful",
  });
});


// Logout User
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json("Logout Successful");
});

// Get Login Status
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  // Verify Token
  const verified = jwt.verify(token, process.env.MY_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

// Update User
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

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  //Validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }

  // check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  // Save new password
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res
      .status(200)
      .json({ message: "Password change successful, please re-login" });
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }

  // send Changepassword mail
  const subject = "Your Password was Changed";
  const send_to = user.email;
  const sent_from = "Nestlypay <hello@nestlypay.com>";
  const reply_to = "no-reply@nestlypay.com";
  const template = "changePassword";
  const name = user.name;


  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
    );
    res
      .status(200)
      .json({ success: true, message: "Change Password mail Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }

});




// forgotPassword
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  // Delete token if it exists in DB
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Create Reset Token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken);

  // Hash token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save Token to DB
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
  }).save();

  // Construct Reset Url
  const resetUrl = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;
  console.log(resetUrl);

  // Reset Email
  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = "Nestlypay <hello@nestlypay.com>";
  const reply_to = "no-reply@nestlypay.com";
  const template = "forgotPassword";
  const name = user.name;
  const link = resetUrl;

  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      link
    );
    res.status(200).json({ success: true, message: "Email Sent!!!" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // Hash token, then compare to Token in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Find Token in DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token");
  }

  // Find user and reset password
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();

  res.status(200).json({
    message: "Password Reset Successful, Please Login",
  });
});


// Send Automated Email
const sendAutomatedEmail = asyncHandler(async (req, res) => {
  const { subject, send_to, reply_to, template, url } = req.body;
  // res.send(template);

  if (!subject || !send_to || !reply_to || !template) {
    res.status(400);
    throw new Error("Missing automated email parameter");
  }

  // Get user
  const user = await User.findOne({ email: send_to });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const sent_from = process.env.EMAIL_USER;
  const name = user.name;
  const link = `${process.env.FRONTEND_URL}${url}`;
  // const role = user.role;

  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      link
    );
    res.status(200).json({ success: true, message: "Email Sent!!!" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});


//REFETCH USER
const refetch = asyncHandler(async (req, res) => {
  try {
    const token = req.cookies.token
    if (!token) {
      return res.json({ message: "user not loggedIn" })
    }

    // Verify the token and extract user information
    const verified = jwt.verify(token, process.env.SECRET)

    // Retrieve user details from the database using the decoded user ID
    const user = await User.findById(verified.id).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    return res.status(200).json({ user })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Server Error" })
  }
})


module.exports = {
  register,
  refetch,
  sendVerificationEmail,
  verifyUser,
  login,
  logout,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
  sendAutomatedEmail,
};