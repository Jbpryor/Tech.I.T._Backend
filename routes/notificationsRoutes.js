const express = require('express')
const router = express.Router()
const notificationsController = require('../controllers/notificationsController')

router.route('/')
    .get(notificationsController.getAllNotifications)
    .post(notificationsController.addNewNotification)

module.exports = router