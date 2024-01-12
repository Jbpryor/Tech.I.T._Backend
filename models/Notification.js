const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    currentDate: {
        type: String,
        required: true,
    },
    isNewNotification: {
        type: Boolean,
        default: true,
    },
    message: {
        type: String,
        required: true
    },
    notificationLink: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true
    }
})


const Notification = mongoose.model("Notification", notificationSchema)

module.exports = Notification