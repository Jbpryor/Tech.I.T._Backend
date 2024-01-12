const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
    attachments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Attachment'
        }
    ],
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ],
    created: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    id: {
        type: Number,
        required: true,
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