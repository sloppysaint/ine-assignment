import express from 'express'
import { Notification } from '../models/notification'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = express.Router()

// Get user notifications
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user!.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    })

    res.json({ notifications })
  } catch (error) {
    next(error)
  }
})

// Mark notification as read
router.post('/:id/read', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { 
        id: req.params.id,
        userId: req.user!.id 
      }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    await notification.update({ read: true })
    res.json({ message: 'Notification marked as read' })
  } catch (error) {
    next(error)
  }
})

export default router