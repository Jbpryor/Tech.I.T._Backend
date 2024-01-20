const express = require('express')
const router = express.Router()
const issuesController = require('../controllers/issuesController')
const uploadAttachment = require('../middleware/uploadAttachment')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
    .get(issuesController.getAllIssues)
    .post(issuesController.createNewIssue)
    .patch(uploadAttachment.single('file'), issuesController.updateIssue)
    .delete(issuesController.deleteIssue)

router.route('/:issueId/comments/:commentId')
    .delete(issuesController.deleteComment)

router.route('/:issueId/attachments/:attachmentId')
    .get(issuesController.downloadAttachment)
    .delete(issuesController.deleteAttachment)

module.exports = router