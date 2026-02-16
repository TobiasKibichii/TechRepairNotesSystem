const express = require('express')
const { getUserNotifications, markAsRead } = require('../controllers/notificationController.js')
const verifyJWT = require('../middleware/verifyJWT.js')

const router = express.Router()

router.use(verifyJWT)

router.get('/', getUserNotifications)
router.patch('/:id/read', markAsRead)

module.exports = router
