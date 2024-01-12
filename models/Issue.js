const mongoose = require('mongoose')

const issueSchema = new mongoose.Schema({
    attachments: [
        {
            fileName: {
                type: String,
                required: true,
            },
            fileId: {
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
    comments: [
        {
            userName: {
                type: String,
                required: true
            },
            comment: {
                type: String,
                required: true
            },
            timeStamp: {
                type: Date,
                default: Date.now,
                required: true
            }
        },
    ],
    created: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    developer: {
        type: String,
        required: true,
    },
    modifications: [
        {
            type: {
                type: String,
                required: true
            },
            previousState: {
                type: String,
                required: true
            },
            currentState: {
                type: String,
                required: true
            },
            modified: {
                type: String,
                required: true
            },
        }
    ],
    modified: {
        type: String, //change this to modifications[0 or -1]
        required: false,
    },
    priority: {
        type: String,
        required: true,
    },
    project: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    submitter: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true
    },
})

const Issue = mongoose.model("Issue", issueSchema)

module.exports = Issue