const dotenv = require("dotenv");
dotenv.config()

const express = require("express");

// Security

const helmet = require("helmet");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const mongoSanitize = require("express-mongo-sanitize");
const expressSanitizer = require('express-sanitizer');
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");

const nodemailer = require("nodemailer");
const app = express();
const path = require("path");
const { logger } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")

const connectDB = require("./config/dbConn")

const errorHandlerr = require("./middleware/errorMiddleware")

// Connecting to Database Environments
console.log((process.env.NODE_ENV))
connectDB()

// Middlewares
app.use(logger)

app.use(cors(corsOptions))

// Error Middleware
app.use(errorHandler)
app.use(errorHandlerr)

app.use(express.json({ limit: "30mb", extended: true }))
app.use(
	helmet.contentSecurityPolicy({
		useDefaults: true,
		directives: {
			"img-src": ["'self'", "https: data:"],
		},
	}),
)

app.use(cookieParser());
app.use(express.urlencoded({ limit: "30mb", extended: false }));
app.use(bodyParser.json());

// app.use(expressSanitizer());

// // Prevent SQL injection
// app.use(mongoSanitize());

// limit queries per 15min
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

app.use(limiter);

// HTTP Param Pollution
app.use(hpp())

// Routes
app.use("/", express.static(path.join(__dirname, "public")))

app.use("/", require("./routes/root"))
app.use("/api/auth", require("./routes/authRoute"))
app.use('/api/users', require("./routes/userRoute"))
app.use('/api/content', require("./routes/contentRoute"))
app.use('/api/subscriptions', require("./routes/subscriptionRoute"));

app.use((req, res) => {
    res.status(404);
    if (req.accepts("html")) {
      res.sendFile(path.join(__dirname, "views", "404.html"));
    } else if (req.accepts("json")) {
      res.json({ message: "404 Not Found" });
    } else {
      res.type("txt").send("404 Not Found");
    }
  });


module.exports = app