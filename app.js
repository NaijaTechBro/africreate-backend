require('dotenv').config();

const express = require('express');

// Security
const helmet = require('helmet');
const cors = require('cors');
const whitelist = require('./config/whiteList')

const app = express();
const path = require('path');
const { logger} = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');


const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");

const connectDB = require('./config/dbConn');

const errorHandlerr = require("./middleware/errorMiddleware");
const expressSanitizer = require('express-sanitizer');

// Connecting to Database Environments
console.log(process.env.NODE_ENV)
connectDB()

// Middlewares
app.use(logger)

// Cross Origin Resource Sharing
app.use(cors(whitelist));

// Error Middleware
app.use(errorHandler)
app.use(errorHandlerr)

app.use(express.json({ limit: "30mb", extended: true}))

app.use(cookieParser())
app.use(express.urlencoded({ limit: "30mb", extended: false}))
app.use(bodyParser.json())

app.use(
    helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            "img-src": ["'self'", "https: data:"],
        },
    }),
)
app.use(expressSanitizer());


// Routes
app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/', require('./routes/root'))
app.use("/api", require("./routes/authRoutes"));
app.use("/api", require("./routes/userRoutes"));
app.use("/api", require("./routes/contentRoutes"));
app.use("/api", require("./routes/subscriptionRoutes"));
app.use("/api", require("./routes/profileRoutes"));
app.use("/api", require("./routes/contactRoutes"));
app.use((req, res) => {
    res.status(404)
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if (req.accepts('json')) {
        res.json({ message: '404 Not Found' })
    } else {
        res.type('txt').send('404 Not Found')
    }
});

module.exports = app
