const Notifications = require('../models/Notifications')
const asyncHandler = require('express-async-handler')

const getAllNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notifications.find()

    if (!notifications?.length) {
        return res.status(400).json({ message: 'No notifications found' })
    }

    res.json(notifications)
})

const addNewNotification = asyncHandler(async (req, res) => {

    const { newNotification } = req.body;

    try {
        const createdNotification = await Notifications.create(newNotification);
        res.status(201).json(createdNotification)
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'There was an error adding notifications' });
    }
});


module.exports = {
    getAllNotifications,
    addNewNotification,
}