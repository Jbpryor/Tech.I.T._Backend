const Report = require('../models/Report')
const asyncHandler = require('express-async-handler')
const mongoose = require('mongoose');



// @desc Get all reports
// @route GET /reports
// @access Private
const getAllReports = asyncHandler(async (req, res) => {
    const reports = await Report.find().lean();

    if (!reports?.length) {
        return res.status(400).json({ message: 'No Reports found' })
    }

    res.json(reports)
})

// @desc Create a new report
// @route POST /reports
// @access Private
const createNewReport = asyncHandler(async (req, res) => {
    const { created, description, project, subject, submitter, type } = req.body;

    if (!created || !description || !project || !subject || !submitter || !type) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const report = await Report.create({ created, description, project, subject, submitter, type });

        if (report) {
            // Created
            return res.status(201).json({
                message: `New report ${report.subject} created`,
                subject: subject,
                reportId: report._id,
            });
        } else {
            return res.status(400).json({ message: 'Invalid report data received' });
        }
    } catch (error) {
        // Handle any errors that occurred during user creation
        console.error(error);
        return res.status(500).json({ message: 'Report creation failed' });
    }
});


// @desc Update a report
// @route PATCH /reports
// @access Private
const updateReport = asyncHandler(async (req, res) => {
    const { _id, userName, comments } = req.body;
    const file = req.file;

    if (!_id) {
        return res.status(400).json({ message: 'Report Id is required' })
    }

    const report = await Report.findById(_id).exec()

    if (!report) {
        return res.status(409).json({ message: 'Report not found' });
    }

    // Check for duplicate title
    const duplicate = await Report.findOne({ subject }).collation({ locale: 'en', strength: 2 }).lean().exec()

    // Allow renaming of the original report 
    if (duplicate && duplicate?._id.toString() !== _id) {
        return res.status(409).json({ message: 'Duplicate report title' })
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
            ...report?.attachments
        ];

    }

    if (comments) {
        if (!comments.userName || !comments.comment) {
            updateFields.comments = [...report?.comments]
        } else (
            updateFields.comments = [
                {
                    userName: comments.userName,
                    comment: comments.comment,
                },
                ...report?.comments
            ]
        )
    }

    // if (modifications) {
    //     if (!modifications.type || !modifications.previousState || !modifications.currentState || !modifications.modified) {
    //         updateFields.modifications = [...report?.modifications]
    //     } else {
    //         updateFields.modifications = [
    //             {
    //                 type: modifications.type,
    //                 previousState: modifications.previousState,
    //                 currentState: modifications.currentState,
    //                 modified: modifications.modified,
    //             },
    //             ...report?.modifications
    //         ];
    //     }
    // }

    updateFields.created = created
    updateFields.description = description
    // updateFields.developer = developer
    // updateFields.modified = modified
    // updateFields.priority = priority
    updateFields.project = project
    updateFields.subject = subject
    updateFields.submitter = submitter
    // updateFields.title = title
    updateFields.type = type


    const updatedReport = await Report.findByIdAndUpdate(
        _id,
        { $set: updateFields },
        { new: true }
    ).exec();

    return res.status(200).json({
        subject: subject,
        message: `Report ${subject} updated!`,
        updatedReport,
    });
});

// @desc Delete an report comment
// @route DELETE /reports
// @access Private
const deleteComment = asyncHandler(async (req, res) => {
    const { reportId, commentId } = req.params;

    const report = await Report.findById(reportId).exec()

    if (!report) {
        return res.status(409).json({ message: 'Report not found' })
    }

    const comment = report.comments.find(comment => comment._id.toString() === commentId);

    if (!comment) {
        return res.status(409).json({ message: 'Comment not found' })
    }

    const updatedReport = await Report.findByIdAndUpdate(
        reportId,
        { $pull: { comments: { _id: new mongoose.Types.ObjectId(commentId) } } },
        { new: true }
    ).exec();

    return res.status(200).json({ message: 'Comment deleted', updatedReport })
})

// @desc Download an report attachment
// @route GET /reports/:reportId/attachments/:attachmentId
// @access Private
const downloadAttachment = asyncHandler(async (req, res) => {
    const { reportId, attachmentId } = req.params;

    try {
        const report = await Report.findById(reportId).exec();

        if (!report) {
            return res.status(409).json({ message: 'Report not found' });
        }

        const attachment = report.attachments.find(attachment => attachment.fileId.toString() === attachmentId);

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


// @desc Delete an report attachment
// @route DELETE /reports/:reportId/attachments/:attachmentId
// @access Private
const deleteAttachment = asyncHandler(async (req, res) => {
    const { reportId, attachmentId } = req.params;

    const report = await Report.findById(reportId).exec()

    if (!report) {
        return res.status(409).json({ message: 'Report not found' })
    }

    const attachment = report.attachments.find(attachment => attachment.fileId.toString() === attachmentId);

    if (!attachment) {
        return res.status(409).json({ message: 'Attachment not found' })
    }

    const gsfb = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
    gsfb.delete(new mongoose.Types.ObjectId(attachmentId), function (err) {
        if (err) return next(err);
    });

    const updatedReport = await Report.findByIdAndUpdate(
        reportId,
        { $pull: { attachments: { fileId: new mongoose.Types.ObjectId(attachmentId) } } },
        { new: true }
    ).exec();

    res.status(200).json({ message: 'Attachment deleted', updatedReport })
})


// @desc Delete a report
// @route DELETE /reports
// @access Private
const deleteReport = asyncHandler(async (req, res) => {

    const { _id } = req.body

    if (!_id) { return res.status(400).json({ message: 'Report ID Required' }) }

    const report = await Report.findById(_id).exec()

    if (!report) { return res.status(400).json({ message: 'Report not found' }) }

    const deletedReport = await report.deleteOne()

    return res.json({ message: `Report ${report.subject} deleted`, deletedReport })
})

module.exports = {
    getAllReports,
    createNewReport,
    updateReport,
    deleteComment,
    downloadAttachment,
    deleteAttachment,
    deleteReport
}