const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    address: {
        city: {
            type: String,
            required: false,
        },
        country: {
            type: String,
            required: false,
        },
        state: {
            type: String,
            required: false,
        },
        street: {
            type: String,
            required: false,
        },
        zip: {
            type: String,
            required: false,
        }
    },
    created: {
        type: Date,
        default: Date.now(),
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        first: {
            type: String,
            required: true,
            minLength: 2,
            maxLength: 15,
        },
        last: {
            type: String,
            required: true,
            minLength: 2,
            maxLength: 30,
        },
    },
    notifications: [
        {
            date: {
                type: String,
                required: false,
            },
            isNewNotification: {
                type: Boolean,
                required: false,
                default: true,
            },
            message: {
                type: String,
                required: false
            },
            notificationLink: {
                type: String,
                required: false,
            },
            title: {
                type: String,
                required: false
            }
        },
    ],
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    role: {
        type: String,
        required: true
    },
    userImage: [
        {
            imageName: {
                type: String,
                required: true,
            },
            imageId: {
                type: String,
                required: true,
            },
            originalName: {
                type: String,
                required: true,
            },
            userName: {
                type: String,
                required: true,
            },
            contentType: {
                type: String,
                required: true,
            },
            uploadDate: {
                type: String,
                required: true,
            }
        }
    ],
})

const User = mongoose.model('User', userSchema);

module.exports = User;