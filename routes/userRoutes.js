const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')
const uploadImage = require('../middleware/uploadImage')

router.route('/')
    .get(usersController.getAllUsers)
    .post(usersController.createNewUser)
    .patch(uploadImage.single('file'), usersController.updateUser)
    .delete(usersController.deleteUser)

router.route('/:userId/:imageId')
    .get(usersController.viewImage)

module.exports = router