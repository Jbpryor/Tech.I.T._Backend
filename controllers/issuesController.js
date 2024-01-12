const Issue = require('../models/Issue')
const asyncHandler = require('express-async-handler')
const mongoose = require('mongoose');



// @desc Get all issues
// @route GET /issues
// @access Private
const getAllIssues = asyncHandler(async (req, res) => {
    const issues = await Issue.find().lean();

    if (!issues?.length) {
        return res.status(400).json({ message: 'No Issues found' })
    }

    res.json(issues)
})

// @desc Create a new issue
// @route POST /issues
// @access Private
const createNewIssue = asyncHandler(async (req, res) => {
    const { created, description, developer, priority, project, status, submitter, title, type } = req.body;

    if (!created || !description || !developer || !priority || !project || !status || !submitter || !title || !type) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const issue = await Issue.create({ created, description, developer, priority, project, status, submitter, title, type });

        if (issue) {
            // Created
            return res.status(201).json({
                message: `New issue ${issue.title} created`,
                title: title,
                issueId: issue._id,
            });
        } else {
            return res.status(400).json({ message: 'Invalid issue data received' });
        }
    } catch (error) {
        // Handle any errors that occurred during user creation
        console.error(error);
        return res.status(500).json({ message: 'Issue creation failed' });
    }
});


// @desc Update a issue
// @route PATCH /issues
// @access Private
const updateIssue = asyncHandler(async (req, res) => {
    const { _id, userName, comments, created, description, developer, modifications, modified, priority, project, status, submitter, title, type } = req.body;
    const file = req.file;

    if (!_id) {
        return res.status(400).json({ message: 'Issue Id is required' })
    }

    const issue = await Issue.findById(_id).exec()

    if (!issue) {
        return res.status(409).json({ message: 'Issue not found' });
    }

    // Check for duplicate title
    const duplicate = await Issue.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

    // Allow renaming of the original issue 
    if (duplicate && duplicate?._id.toString() !== _id) {
        return res.status(409).json({ message: 'Duplicate issue title' })
    }

    let updateFields = {};

    if (file) {

        updateFields.attachments = [
            {
                fileName: file.filename,
                fileId: file.id,
                originalName: file.originalname,
                userName: userName,
                uploadDate: file.uploadDate,
                contentType: file.contentType,
            },
            ...issue?.attachments
        ];

    }

    if (comments) {
        if (!comments.userName || !comments.comment) {
            updateFields.comments = [...issue?.comments]
        } else (
            updateFields.comments = [
                {
                    userName: comments.userName,
                    comment: comments.comment,
                },
                ...issue?.comments
            ]
        )
    }

    if (modifications) {
        if (!modifications.type || !modifications.previousState || !modifications.currentState || !modifications.modified) {
            updateFields.modifications = [...issue?.modifications]
        } else {
            updateFields.modifications = [
                {
                    type: modifications.type,
                    previousState: modifications.previousState,
                    currentState: modifications.currentState,
                    modified: modifications.modified,
                },
                ...issue?.modifications
            ];
        }
    }

    updateFields.created = created
    updateFields.description = description
    updateFields.developer = developer
    updateFields.modified = modified
    updateFields.priority = priority
    updateFields.project = project
    updateFields.status = status
    updateFields.submitter = submitter
    updateFields.title = title
    updateFields.type = type


    const updatedIssue = await Issue.findByIdAndUpdate(
        _id,
        { $set: updateFields },
        { new: true }
    ).exec();

    return res.status(200).json({
        title: title,
        message: `Issue ${title} updated!`,
        updatedIssue,
    });
});

// @desc Delete an issue comment
// @route DELETE /issues
// @access Private
const deleteComment = asyncHandler(async (req, res) => {
    const { issueId, commentId } = req.params;

    const issue = await Issue.findById(issueId).exec()

    if (!issue) {
        return res.status(409).json({ message: 'Issue not found' })
    }

    const comment = issue.comments.find(comment => comment._id.toString() === commentId);

    if (!comment) {
        return res.status(409).json({ message: 'Comment not found' })
    }

    const updatedIssue = await Issue.findByIdAndUpdate(
        issueId,
        { $pull: { comments: { _id: new mongoose.Types.ObjectId(commentId) } } },
        { new: true }
    ).exec();

    return res.status(200).json({ message: 'Comment deleted', updatedIssue })
})

// @desc Download an issue attachment
// @route GET /issues/:issueId/attachments/:attachmentId
// @access Private
const downloadAttachment = asyncHandler(async (req, res) => {
    const { issueId, attachmentId } = req.params;

    try {
        const issue = await Issue.findById(issueId).exec();

        if (!issue) {
            return res.status(409).json({ message: 'Issue not found' });
        }

        const attachment = issue.attachments.find(attachment => attachment.fileId.toString() === attachmentId);

        if (!attachment) {
            return res.status(409).json({ message: 'Attachment not found' });
        }

        const gsfb = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
        const stream = gsfb.openDownloadStream(new mongoose.Types.ObjectId(attachmentId));

        stream.on('error', (err) => {
            console.error('Error downloading attachment:', err);
            res.status(500).json({ message: 'Internal server error' });
        });

        res.setHeader('Content-Type', attachment.contentType)

        const chunks = [];

        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        stream.on('end', () => {
            const binaryData = Buffer.concat(chunks).toString('base64')
            res.json({ data: binaryData, contentType: attachment.contentType })
        });

    } catch (error) {
        console.error('Error in downloadAttachment function:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// @desc Delete an issue attachment
// @route DELETE /issues/:issueId/attachments/:attachmentId
// @access Private
const deleteAttachment = asyncHandler(async (req, res) => {
    const { issueId, attachmentId } = req.params;

    const issue = await Issue.findById(issueId).exec()

    if (!issue) {
        return res.status(409).json({ message: 'Issue not found' })
    }

    const attachment = issue.attachments.find(attachment => attachment.fileId.toString() === attachmentId);

    if (!attachment) {
        return res.status(409).json({ message: 'Attachment not found' })
    }

    const gsfb = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
    gsfb.delete(new mongoose.Types.ObjectId(attachmentId), function (err) {
        if (err) return next(err);
    });

    const updatedIssue = await Issue.findByIdAndUpdate(
        issueId,
        { $pull: { attachments: { fileId: new mongoose.Types.ObjectId(attachmentId) } } },
        { new: true }
    ).exec();

    res.status(200).json({ message: 'Attachment deleted', updatedIssue })
})


// @desc Delete a issue
// @route DELETE /issues
// @access Private
const deleteIssue = asyncHandler(async (req, res) => {

    const { id } = req.body

    if (!id) { return res.status(400).json({ message: 'Issue ID Required' }) }

    const issue = await Issue.findById(id).exec()

    if (!issue) { return res.status(400).json({ message: 'Issue not found' }) }

    const deletedIssue = await issue.deleteOne()

    return res.json({ message: `Issue ${issue.title} deleted`, deletedIssue })
})

module.exports = {
    getAllIssues,
    createNewIssue,
    updateIssue,
    deleteComment,
    downloadAttachment,
    deleteAttachment,
    deleteIssue
}