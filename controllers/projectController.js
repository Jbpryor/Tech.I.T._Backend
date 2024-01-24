const Project = require('../models/Project')
const User = require('../models/User')
const asyncHandler = require('express-async-handler')



// @desc Get all projects
// @route GET /projects
// @access Private
const getAllProjects = asyncHandler(async (req, res) => {
    const projects = await Project.find().lean();

    if (!projects?.length) {
        return res.status(400).json({ message: 'No Projects found' })
    }

    res.json(projects)
})

// @desc Create a new project
// @route POST /projects
// @access Private
const createNewProject = asyncHandler(async (req, res) => {
    const { backend, clientName, created, description, frontend, manager, title, type } = req.body;

    if (!created || !description || !manager || !title) {
        return res.status(400).json({ message: 'Created, Description, Manager, and Title fields are required' });
    }

    try {
        const project = await Project.create({ backend, clientName, created, description, frontend, manager, title, type });

        if (project) {
            // Created
            const currentDate = new Date().toISOString();

            const notificationObject = [
                {
                    date: currentDate,
                    isNewNotification: true,
                    message: `New project ${project.title} created`,
                    notificationLink: `/projects/${project._id}`,
                    title: userName,
                }
            ];

            const targetRoles = ["Admin", "Project Manager"];
            const targetUsers = await User.find({ role: { $in: targetRoles } });

            const updatePromises = targetUsers.map(async (targetUser) => {
                const isAdmin = targetUser.role === "Admin";

                const isProjectManager = targetUser.role === "Project Manager";
                const isMatchingManager = targetUser.name.first === project.manager.split(' ')[0] && targetUser.name.last === project.manager.split(' ')[1];
                const isManager = [isProjectManager, isMatchingManager].every(Boolean)

                if (isAdmin || isManager) {
                    targetUser.notifications.unshift(notificationObject);

                    if (targetUser.notifications.length > 100) {
                        targetUser.notifications = targetUser.notifications.slice(0, 100)
                    }
                    await targetUser.save();
                }
            });

            await Promise.all(updatePromises);

            return res.status(201).json({
                message: `New project ${project.title} created`,
                title: title,
                projectId: project._id,
            });
        } else {
            return res.status(400).json({ message: 'Invalid project data received' });
        }
    } catch (error) {
        // Handle any errors that occurred during user creation
        console.error(error);
        return res.status(500).json({ message: 'Project creation failed' });
    }
});


// @desc Update a project
// @route PATCH /projects
// @access Private
const updateProject = asyncHandler(async (req, res) => {
    const { _id, backend, clientName, created, description, frontend, manager, title, type } = req.body;
    // const file = req.file;

    if (!_id) {
        return res.status(400).json({ message: 'Project Id is required' })
    }

    const project = await Project.findById(_id).exec()

    if (!project) {
        return res.status(409).json({ message: 'Project not found' });
    }

    // Check for duplicate title
    const duplicate = await Project.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

    // Allow renaming of the original project 
    if (duplicate && duplicate?._id.toString() !== _id) {
        return res.status(409).json({ message: 'Duplicate project title' })
    }

    let updateFields = {};

    // if (file) {

    //     updateFields.attachments = [
    //         {
    //             fileName: file.filename,
    //             fileId: file.id,
    //             originalName: file.originalname,
    //             userName: userName,
    //             uploadDate: file.uploadDate,
    //             contentType: file.contentType,
    //         },
    //         ...project?.attachments
    //     ];

    // }

    // if (comments) {
    //     if (!comments.userName || !comments.comment) {
    //         updateFields.comments = [...project?.comments]
    //     } else (
    //         updateFields.comments = [
    //             {
    //                 userName: comments.userName,
    //                 comment: comments.comment,
    //             },
    //             ...project?.comments
    //         ]
    //     )
    // }

    // if (modifications) {
    //     if (!modifications.type || !modifications.previousState || !modifications.currentState || !modifications.modified) {
    //         updateFields.modifications = [...project?.modifications]
    //     } else {
    //         updateFields.modifications = [
    //             {
    //                 type: modifications.type,
    //                 previousState: modifications.previousState,
    //                 currentState: modifications.currentState,
    //                 modified: modifications.modified,
    //             },
    //             ...project?.modifications
    //         ];
    //     }
    // }

    updateFields.backend = backend
    updateFields.clientName = clientName
    updateFields.created = created
    updateFields.description = description
    updateFields.frontend = frontend
    updateFields.manager = manager
    updateFields.title = title
    updateFields.type = type


    const updatedProject = await Project.findByIdAndUpdate(
        _id,
        { $set: updateFields },
        { new: true }
    ).exec();

    return res.status(200).json({
        title: title,
        message: `Project ${title} updated!`,
        updatedProject,
    });
});

// @desc Delete an project comment
// @route DELETE /projects
// @access Private
// const deleteComment = asyncHandler(async (req, res) => {
//     const { projectId, commentId } = req.params;

//     const project = await Project.findById(projectId).exec()

//     if (!project) {
//         return res.status(409).json({ message: 'Project not found' })
//     }

//     const comment = project.comments.find(comment => comment._id.toString() === commentId);

//     if (!comment) {
//         return res.status(409).json({ message: 'Comment not found' })
//     }

//     const updatedProject = await Project.findByIdAndUpdate(
//         projectId,
//         { $pull: { comments: { _id: new mongoose.Types.ObjectId(commentId) } } },
//         { new: true }
//     ).exec();

//     return res.status(200).json({ message: 'Comment deleted', updatedProject })
// })

// @desc Download an project attachment
// @route GET /projects/:projectId/attachments/:attachmentId
// @access Private
// const downloadAttachment = asyncHandler(async (req, res) => {
//     const { projectId, attachmentId } = req.params;

//     try {
//         const project = await Project.findById(projectId).exec();

//         if (!project) {
//             return res.status(409).json({ message: 'Project not found' });
//         }

//         const attachment = project.attachments.find(attachment => attachment.fileId.toString() === attachmentId);

//         if (!attachment) {
//             return res.status(409).json({ message: 'Attachment not found' });
//         }

//         const gsfb = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
//         const stream = gsfb.openDownloadStream(new mongoose.Types.ObjectId(attachmentId));

//         stream.on('error', (err) => {
//             console.error('Error downloading attachment:', err);
//             res.status(500).json({ message: 'Internal server error' });
//         });

//         res.setHeader('Content-Type', attachment.contentType)

//         const chunks = [];

//         stream.on('data', (chunk) => {
//             chunks.push(chunk);
//         });

//         stream.on('end', () => {
//             const binaryData = Buffer.concat(chunks).toString('base64')
//             res.json({ data: binaryData, contentType: attachment.contentType })
//         });

//     } catch (error) {
//         console.error('Error in downloadAttachment function:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });


// @desc Delete an project attachment
// @route DELETE /projects/:projectId/attachments/:attachmentId
// @access Private
// const deleteAttachment = asyncHandler(async (req, res) => {
//     const { projectId, attachmentId } = req.params;

//     const project = await Project.findById(projectId).exec()

//     if (!project) {
//         return res.status(409).json({ message: 'Project not found' })
//     }

//     const attachment = project.attachments.find(attachment => attachment.fileId.toString() === attachmentId);

//     if (!attachment) {
//         return res.status(409).json({ message: 'Attachment not found' })
//     }

//     const gsfb = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
//     gsfb.delete(new mongoose.Types.ObjectId(attachmentId), function (err) {
//         if (err) return next(err);
//     });

//     const updatedProject = await Project.findByIdAndUpdate(
//         projectId,
//         { $pull: { attachments: { fileId: new mongoose.Types.ObjectId(attachmentId) } } },
//         { new: true }
//     ).exec();

//     res.status(200).json({ message: 'Attachment deleted', updatedProject })
// })


// @desc Delete a project
// @route DELETE /projects
// @access Private
const deleteProject = asyncHandler(async (req, res) => {

    const { _id } = req.body

    if (!_id) { return res.status(400).json({ message: 'Project ID Required' }) }

    const project = await Project.findById(_id).exec()

    if (!project) { return res.status(400).json({ message: 'Project not found' }) }

    const deletedProject = await project.deleteOne()

    return res.json({ message: `Project ${project.title} deleted`, deletedProject })
})

module.exports = {
    getAllProjects,
    createNewProject,
    updateProject,
    deleteProject
}