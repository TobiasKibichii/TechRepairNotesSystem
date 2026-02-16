const Notification = require('../models/Notification')

// @desc Get all notifications for a user
// @route GET /notifications
// @access Private
const getUserNotifications = async (req, res) => {
  console.log(req.user.id)
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .lean()
  res.json(notifications)
}

// @desc Mark notification as read
// @route PATCH /notifications/:id/read
const markAsRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true })
  res.json({ message: 'Notification marked as read' })
}

module.exports = {
  getUserNotifications,
  markAsRead
}
