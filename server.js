// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const contentRoutes = require('./routes/content');
// const subscriptionRoutes = require('./routes/subscriptions');
// const paymentRoutes = require('./routes/payments');
// const { setupSocket } = require('./utils/socket');

// dotenv.config();
// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // Database Connection
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log('Connected to MongoDB'))
// .catch(err => console.error('MongoDB connection error:', err));

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/content', contentRoutes);
// app.use('/api/subscriptions', subscriptionRoutes);
// app.use('/api/payments', paymentRoutes);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ message: 'Something went wrong!', error: err.message });
// });

// const PORT = process.env.PORT || 5000;
// const server = app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// // Setup WebSocket
// setupSocket(server);







require("dotenv").config()
const mongoose = require("mongoose")
const chalk = require("chalk")
const app = require("./app")
const PORT = process.env.PORT || PORT

const { logger, logEvents } = require("./middleware/logger")

// Connect to MongoDB
mongoose.set("strictQuery", true)
mongoose.connection.once("open", () => {
  console.log(("Connected to MongoDB"))
  app.listen(PORT, () => console.log((`Server running on port ${PORT}...`)))
})

mongoose.connection.on("error", (err) => {
  console.log(err)
  logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, "mongoErrLog.log")
})