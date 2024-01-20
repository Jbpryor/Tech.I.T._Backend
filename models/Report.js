const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
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
        required: true
    },
    description: {
        type: String,
        required: true
    },
    project: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    submitter: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
    }
})

const Report = mongoose.model("Report", reportSchema)

module.exports = Report