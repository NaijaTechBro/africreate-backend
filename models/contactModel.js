const mongoose = require("mongoose");

const contactSchema = mongoose.Schema(
    {
        subject: {
            type: String,
        },
        message: {
            type: String,
        },
        userId: {
            type: String
        },
    }
);

module.exports = mongoose.model("Contact", contactSchema);