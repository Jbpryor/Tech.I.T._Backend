const User = require('../models/User')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose');
const genTempPass = require('../utils/genTempPass')
const emailTempPass = require('../utils/emailTempPass')


// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()

    if (!users?.length) {
        return res.status(400).json({ message: 'No users found' })
    }

    res.json(users)
})


// @desc Create a new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    const { name: { first, last }, email, role } = req.body;

    if (!first || !last || !email || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check for duplicate
        const duplicate = await User.findOne({
            $or: [
                { $and: [{ 'name.first': first }, { 'name.last': last }] },
                { email: email },
            ],
        }).lean().exec();

        if (duplicate) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const temporaryPassword = genTempPass(8);

        // Hash password
        const hashedPwd = await bcrypt.hash(temporaryPassword, 10); // salt rounds

        const userObject = {
            name: {
                first: first,
                last: last,
            },
            email: email,
            password: hashedPwd,
            role: role,
        };

        const user = await User.create(userObject);

        const userName = `${first} ${last}`;

        if (user) {
            // Created

            emailTempPass(email, temporaryPassword)

            const currentDate = new Date().toISOString();

            const notificationObject = [
                {
                    date: currentDate,
                    isNewNotification: true,
                    message: `New user ${userName} created`,
                    notificationLink: `/users/${user._id}`,
                    notificationType: 'newUser',
                    title: userName,
                }
            ];

            const targetRoles = ["Admin", "Project Manager"];
            const targetUsers = await User.find({ role: { $in: targetRoles } });

            const updatePromises = targetUsers.map(async (targetUser) => {
                targetUser.notifications.unshift(...notificationObject);

                if (targetUser.notifications.length > 100) {
                    targetUser.notifications = targetUser.notifications.slice(0, 100)
                }
                await targetUser.save();
            });

            await Promise.all(updatePromises);

            return res.status(201).json({
                userName: userName,
                message: `New user ${userName} created`,
                userId: user._id,
                temporaryPassword: temporaryPassword
            });
        } else {
            return res.status(400).json({ message: 'Invalid user data received' });
        }
    } catch (error) {
        // Handle any errors that occurred during user creation
        console.error(error);
        return res.status(500).json({ message: 'User creation failed' });
    }
});


// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const { _id, email, role, address, passwordData, notificationId } = req.body;
    const file = req.file;

    if (!_id) {
        return res.status(400).json({ message: 'User Id is required' })
    }

    const user = await User.findById(_id).exec()

    if (!user) {
        return res.status(409).json({ message: 'User not found' });
    }

    const userName = user.name.first + " " + user.name.last

    try {

        let updateFields = {};

        if (file) {
            const containsImage = [user.userImage, user.userImage[0], user.userImage.length != 0].every(Boolean);

            if (containsImage) {


                const image = user.userImage[0]
                const imageId = image.imageId;

                const gsfb = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'userImage' });
                gsfb.delete(new mongoose.Types.ObjectId(imageId), function (err) {
                    if (err) return next(err);
                });

                const updatedUser = await User.findByIdAndUpdate(
                    _id,
                    { $pull: { userImage: { imageId: new mongoose.Types.ObjectId(imageId) } } },
                    { new: true }
                ).exec();

            }

            updateFields.userImage = [
                {
                    imageName: file.filename,
                    imageId: file.id,
                    originalName: file.originalname,
                    userName: userName,
                    uploadDate: file.uploadDate,
                    contentType: file.contentType,
                }
            ];

        }

        if (email) {
            updateFields.email = email;
        }

        if (role) {
            updateFields.role = role;
        }

        if (address) {
            updateFields.address = {
                city: address.city,
                country: address.country,
                state: address.state,
                street: address.street,
                zip: address.zip,
            };
        }

        if (passwordData) {

            const { currentPassword, newPassword } = passwordData

            if (!bcrypt.compare(currentPassword, user.password)) {
                return res.status(400).json({ message: 'Current password is invalid' })
            }

            const hashedPwd = await bcrypt.hash(newPassword, 10);

            updateFields.password = hashedPwd
        }

        if (notificationId) {
            await User.updateOne(
                { _id: _id, 'notifications._id': notificationId },
                { $set: { 'notifications.$.isNewNotification': false } }
            );
        }

        const updatedUser = await User.findByIdAndUpdate(
            _id,
            { $set: updateFields },
            { new: true }
        ).exec();

        if (!updatedUser) {
            return res.status(409).json({ message: 'User not found' });
        }

        return res.status(200).json({
            _id: _id,
            userName: userName,
            message: `${userName} updated!`,
            updatedUser,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(400).json({ message: 'Invalid user data received' });
    }
});


// @desc View an user image
// @route GET /users/:userId/:imagetId
// @access Private
const viewImage = asyncHandler(async (req, res) => {
    const { userId, imageId } = req.params;

    try {
        const user = await User.findById(userId).exec();

        if (!user) {
            return res.status(409).json({ message: 'User not found' });
        }

        const image = user.userImage.find(image => image.imageId.toString() === imageId);

        if (!image) {
            return res.status(409).json({ message: 'Image not found' });
        }

        const gsfb = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'userImage' });
        const stream = gsfb.openDownloadStream(new mongoose.Types.ObjectId(image.imageId));

        stream.on('error', (err) => {
            console.error('Error downloading image:', err);
            res.status(500).json({ message: 'Internal server error' });
        });

        res.setHeader('Content-Type', image.contentType)

        const chunks = [];

        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        stream.on('end', () => {
            const binaryData = Buffer.concat(chunks).toString('base64')
            res.json({ data: binaryData, contentType: image.contentType })
        });

    } catch (error) {
        console.error('Error in viewImage function:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { _id } = req.body

    // Comfirm data
    if (!_id) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    // Does the user exist to delete?
    const user = await User.findById(_id).exec()

    if (!user) {
        return res.status(400).json({ message: 'User not found' })
    }

    const deletedUser = await user.deleteOne()

    const allUsers = await User.find();

    const userName = user.name.first + " " + user.name.last

    const updatePromises = allUsers.map(async (targetUser) => {
        const index = targetUser.notifications.findIndex(notifications => notifications.title === userName);

        if (index !== -1) {
            targetUser.notifications.splice(index, 1);

            await targetUser.save();
        }
    })

    await Promise.all(updatePromises);

    const reply = `User ${user.name.first} ${user.name.last} with ID ${user._id} deleted`

    return res.json({
        message: reply
    })
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    viewImage,
    deleteUser
}