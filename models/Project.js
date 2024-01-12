const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema({
    backend: {
        type: String,
        required: false
    },
    clientName: {
        type: String,
        required: false
    },
    created: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    frontend: {
        type: String,
        required: false
    },
    manager: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: false
    },
})

const Project = mongoose.model("Project", projectSchema)

module.exports = Project