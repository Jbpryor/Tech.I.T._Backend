const express = require('express')
const router = express.Router()
const reportsController = require('../controllers/reportsController')
const uploadAttachment = require('../middleware/uploadAttachment')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
    .get(reportsController.getAllReports)
    .post(reportsController.createNewReport)
    .patch(uploadAttachment.single('file'), reportsController.updateReport)
    .delete(reportsController.deleteReport)

router.route('/:reportId/comments/:commentId')
    .delete(reportsController.deleteComment)

router.route('/:reportId/attachments/:attachmentId')
    .get(reportsController.downloadAttachment)
    .delete(reportsController.deleteAttachment)

module.exports = router