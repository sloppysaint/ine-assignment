import express from 'express'
import rateLimit from 'express-rate-limit'
import { Op } from 'sequelize'
import { Auction} from '../models/auction'
import { Bid } from '../models/bid'
import { User } from '../models/user'
import { redis } from '../config/redis'
import { Notification } from '../models/notification'
import { CounterOffer } from '../models/counterOffer'
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth'
import { validate, schemas } from '../utils/validate'
import { isAuctionLive, hasAuctionEnded, getAuctionEndTime } from '../utils/time'
import { broadcastToAuction } from '../socket/rooms'
import { sendEmail, createAcceptanceEmailTemplate } from '../utils/email'
import { generateInvoicePDF } from '../utils/invoice'
import { createError } from '../middleware/error'

const router = express.Router()

// Rate limiting for bids
const bidLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 bids per minute
  message: 'Too many bids, please slow down'
})

// Get all auctions
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const auctions = await Auction.findAll({
      include: [{ model: User, as: 'seller', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    })

    // Update auction statuses
    for (const auction of auctions) {
      const currentStatus = await redis.get(`auction:${auction.id}:status`)
      if (currentStatus && currentStatus !== auction.status) {
        auction.status = currentStatus as any
      } else {
        // Check if status needs updating
        const now = new Date()
        let newStatus = auction.status

        if (auction.status === 'SCHEDULED' && now >= auction.goLiveAt) {
          newStatus = 'LIVE'
        } else if (auction.status === 'LIVE' && hasAuctionEnded(auction.goLiveAt, auction.durationMinutes)) {
          newStatus = 'ENDED'
        }

        if (newStatus !== auction.status) {
          await redis.set(`auction:${auction.id}:status`, newStatus)
          auction.status = newStatus as any
        }
      }
    }

    res.json({ auctions })
  } catch (error) {
    next(error)
  }
})

// Get single auction
router.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const auction = await Auction.findByPk(req.params.id, {
      include: [{ model: User, as: 'seller', attributes: ['id', 'name'] }]
    })

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' })
    }

    // Get highest bid from Redis
    const highestBidAmount = await redis.get(`auction:${auction.id}:highestBid`)
    const highestBidderId = await redis.get(`auction:${auction.id}:highestBidder`)

    let highestBid = null
    if (highestBidAmount && highestBidderId) {
      highestBid = await Bid.findOne({
        where: { 
          auctionId: auction.id, 
          bidderId: highestBidderId, 
          amount: parseInt(highestBidAmount) 
        },
        include: [{ model: User, as: 'bidder', attributes: ['id', 'name'] }]
      })
    }

    // Update status
    const currentStatus = await redis.get(`auction:${auction.id}:status`)
    if (currentStatus) {
      auction.status = currentStatus as any
    }

    res.json({ auction, highestBid })
  } catch (error) {
    next(error)
  }
})

// Create auction
router.post('/', authenticateToken, validate(schemas.createAuction), async (req: AuthRequest, res, next) => {
  try {
    const auction = await Auction.create({
      ...req.body,
      sellerId: req.user!.id
    })

    // Set initial Redis values
    await redis.set(`auction:${auction.id}:status`, 'SCHEDULED')
    await redis.set(`auction:${auction.id}:highestBid`, auction.startingPrice)

    res.status(201).json({ auction })
  } catch (error) {
    next(error)
  }
})

// Place bid
router.post('/:id/bids', bidLimiter, authenticateToken, validate(schemas.placeBid), async (req: AuthRequest, res, next) => {
  try {
    const { amount } = req.body
    const auctionId = req.params.id
    const bidderId = req.user!.id

    // Get auction
    const auction = await Auction.findByPk(auctionId, {
      include: [{ model: User, as: 'seller' }]
    })

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' })
    }

    // Check if user is the seller
    if (auction.sellerId === bidderId) {
      return res.status(400).json({ error: 'Sellers cannot bid on their own auctions' })
    }

    // Check if auction is live
    const status = await redis.get(`auction:${auctionId}:status`) || auction.status
    if (status !== 'LIVE' && !isAuctionLive(auction.goLiveAt, auction.durationMinutes)) {
      return res.status(400).json({ error: 'Auction is not currently active' })
    }

    // Use Redis transaction for atomic bid processing
    const multi = redis.multi()
    const currentHighest = await redis.get(`auction:${auctionId}:highestBid`)
    const currentHighestAmount = currentHighest ? parseInt(currentHighest) : auction.startingPrice

    // Validate bid amount
    const minBid = currentHighestAmount + auction.bidIncrement
    if (amount < minBid) {
      return res.status(400).json({ 
        error: `Bid must be at least ${minBid}` 
      })
    }

    // Get previous highest bidder for outbid notification
    const previousBidderId = await redis.get(`auction:${auctionId}:highestBidder`)

    // Update Redis with new highest bid
    await redis.set(`auction:${auctionId}:highestBid`, amount)
    await redis.set(`auction:${auctionId}:highestBidder`, bidderId)

    // Save bid to database
    const bid = await Bid.create({
      auctionId,
      bidderId,
      amount
    })

    const bidWithUser = await Bid.findByPk(bid.id, {
      include: [{ model: User, as: 'bidder', attributes: ['id', 'name'] }]
    })

    // Create notifications
    const notifications = []

    // Notify seller of new bid
    notifications.push({
      userId: auction.sellerId,
      type: 'NEW_BID',
      payload: {
        auctionId,
        auctionTitle: auction.title,
        amount,
        bidderName: req.user!.name
      }
    })

    // Notify previous highest bidder they've been outbid
    if (previousBidderId && previousBidderId !== bidderId) {
      notifications.push({
        userId: previousBidderId,
        type: 'OUTBID',
        payload: {
          auctionId,
          auctionTitle: auction.title,
          yourBid: currentHighestAmount,
          newBid: amount
        }
      })
    }

    await Notification.bulkCreate(notifications)

    // Broadcast to auction room
    await broadcastToAuction(auctionId, 'bid:accepted', {
      auctionId,
      highestBid: bidWithUser
    })

    // Notify previous bidder they were outbid
    if (previousBidderId && previousBidderId !== bidderId) {
      await broadcastToAuction(auctionId, 'bid:outbid', {
        auctionId,
        yourLastBid: currentHighestAmount
      })
    }

    res.status(201).json({ bid: bidWithUser })
  } catch (error) {
    next(error)
  }
})

// Seller decision
router.post('/:id/decision', authenticateToken, validate(schemas.sellerDecision), async (req: AuthRequest, res, next) => {
  try {
    const { action, counterPrice } = req.body
    const auctionId = req.params.id

    const auction = await Auction.findByPk(auctionId)
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' })
    }

    // Check if user is the seller
    if (auction.sellerId !== req.user!.id) {
      return res.status(403).json({ error: 'Only the seller can make this decision' })
    }

    // Check if auction has ended
    const status = await redis.get(`auction:${auctionId}:status`)
    if (status !== 'ENDED') {
      return res.status(400).json({ error: 'Auction must be ended to make a decision' })
    }

    // Get highest bidder
    const highestBidderId = await redis.get(`auction:${auctionId}:highestBidder`)
    const highestBidAmount = await redis.get(`auction:${auctionId}:highestBid`)

    if (!highestBidderId || !highestBidAmount) {
      return res.status(400).json({ error: 'No bids found for this auction' })
    }

    const highestBidder = await User.findByPk(highestBidderId)
    const seller = await User.findByPk(auction.sellerId)

    if (!highestBidder || !seller) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (action === 'ACCEPT') {
      // Mark auction as closed
      await redis.set(`auction:${auctionId}:status`, 'CLOSED')
      await auction.update({ status: 'CLOSED' })

      // Create notifications
      await Notification.create({
        userId: highestBidderId,
        type: 'ACCEPTED',
        payload: {
          auctionId,
          auctionTitle: auction.title,
          amount: parseInt(highestBidAmount)
        }
      })

      // Send confirmation emails
      const finalPrice = parseInt(highestBidAmount)
      
      // Email to buyer
      await sendEmail({
        to: highestBidder.email,
        subject: `Congratulations! Your bid for "${auction.title}" was accepted`,
        html: createAcceptanceEmailTemplate(
          auction.title,
          finalPrice,
          highestBidder.name,
          seller.name,
          true
        )
      })

      // Email to seller
      await sendEmail({
        to: seller.email,
        subject: `Your auction for "${auction.title}" has been completed`,
        html: createAcceptanceEmailTemplate(
          auction.title,
          finalPrice,
          highestBidder.name,
          seller.name,
          false
        )
      })

      // Generate and send invoices
      try {
        const invoiceData = {
          invoiceNumber: `INV-${auction.id.substring(0, 8).toUpperCase()}`,
          auctionTitle: auction.title,
          finalPrice,
          buyerName: highestBidder.name,
          buyerEmail: highestBidder.email,
          sellerName: seller.name,
          sellerEmail: seller.email,
          date: new Date()
        }

        const invoicePDF = await generateInvoicePDF(invoiceData)
        const invoiceBase64 = invoicePDF.toString('base64')

        // Send invoice to both parties
        await sendEmail({
          to: highestBidder.email,
          subject: `Invoice for "${auction.title}"`,
          html: `<p>Please find attached your invoice for the completed auction.</p>`,
          attachments: [{
            content: invoiceBase64,
            filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
            type: 'application/pdf'
          }]
        })

        await sendEmail({
          to: seller.email,
          subject: `Invoice for "${auction.title}"`,
          html: `<p>Please find attached the invoice for your completed auction.</p>`,
          attachments: [{
            content: invoiceBase64,
            filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
            type: 'application/pdf'
          }]
        })
      } catch (emailError) {
        console.error('Failed to send invoices:', emailError)
      }

      // Broadcast decision
      await broadcastToAuction(auctionId, 'seller:decision', {
        auctionId,
        status: 'ACCEPTED'
      })

    } else if (action === 'REJECT') {
      // Mark auction as closed
      await redis.set(`auction:${auctionId}:status`, 'CLOSED')
      await auction.update({ status: 'CLOSED' })

      // Notify highest bidder
      await Notification.create({
        userId: highestBidderId,
        type: 'REJECTED',
        payload: {
          auctionId,
          auctionTitle: auction.title,
          amount: parseInt(highestBidAmount)
        }
      })

      // Broadcast decision
      await broadcastToAuction(auctionId, 'seller:decision', {
        auctionId,
        status: 'REJECTED'
      })

    } else if (action === 'COUNTER') {
      // Create counter offer
      await CounterOffer.create({
        auctionId,
        sellerId: auction.sellerId,
        bidderId: highestBidderId,
        price: counterPrice,
        status: 'PENDING'
      })

      // Notify highest bidder
      await Notification.create({
        userId: highestBidderId,
        type: 'COUNTER_OFFER',
        payload: {
          auctionId,
          auctionTitle: auction.title,
          originalBid: parseInt(highestBidAmount),
          counterPrice
        }
      })

      // Broadcast counter offer
      await broadcastToAuction(auctionId, 'seller:decision', {
        auctionId,
        status: 'COUNTER',
        counterPrice
      })
    }

    res.json({ message: 'Decision processed successfully' })
  } catch (error) {
    next(error)
  }
})

// Counter offer response
router.post('/:id/counter/response', authenticateToken, validate(schemas.counterResponse), async (req: AuthRequest, res, next) => {
  try {
    const { accept } = req.body
    const auctionId = req.params.id

    const auction = await Auction.findByPk(auctionId)
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' })
    }

    // Find pending counter offer
    const counterOffer = await CounterOffer.findOne({
      where: {
        auctionId,
        bidderId: req.user!.id,
        status: 'PENDING'
      }
    })

    if (!counterOffer) {
      return res.status(404).json({ error: 'No pending counter offer found' })
    }

    // Get seller and bidder details
    const seller = await User.findByPk(counterOffer.sellerId)
    const bidder = await User.findByPk(counterOffer.bidderId)

    if (!seller || !bidder) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (accept) {
      // Accept counter offer
      await counterOffer.update({ status: 'ACCEPTED' })
      await redis.set(`auction:${auctionId}:status`, 'CLOSED')
      await auction.update({ status: 'CLOSED' })

      // Send confirmation emails and invoices (similar to direct acceptance)
      const finalPrice = counterOffer.price
      
      await sendEmail({
        to: bidder.email,
        subject: `Counter offer accepted for "${auction.title}"`,
        html: createAcceptanceEmailTemplate(
          auction.title,
          finalPrice,
          bidder.name,
          seller.name,
          true
        )
      })

      await sendEmail({
        to: seller.email,
        subject: `Counter offer accepted for "${auction.title}"`,
        html: createAcceptanceEmailTemplate(
          auction.title,
          finalPrice,
          bidder.name,
          seller.name,
          false
        )
      })

      // Generate invoice
      try {
        const invoiceData = {
          invoiceNumber: `INV-${auction.id.substring(0, 8).toUpperCase()}`,
          auctionTitle: auction.title,
          finalPrice,
          buyerName: bidder.name,
          buyerEmail: bidder.email,
          sellerName: seller.name,
          sellerEmail: seller.email,
          date: new Date()
        }

        const invoicePDF = await generateInvoicePDF(invoiceData)
        const invoiceBase64 = invoicePDF.toString('base64')

        await sendEmail({
          to: bidder.email,
          subject: `Invoice for "${auction.title}"`,
          html: `<p>Please find attached your invoice for the completed auction.</p>`,
          attachments: [{
            content: invoiceBase64,
            filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
            type: 'application/pdf'
          }]
        })

        await sendEmail({
          to: seller.email,
          subject: `Invoice for "${auction.title}"`,
          html: `<p>Please find attached the invoice for your completed auction.</p>`,
          attachments: [{
            content: invoiceBase64,
            filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
            type: 'application/pdf'
          }]
        })
      } catch (emailError) {
        console.error('Failed to send invoice:', emailError)
      }

      // Broadcast acceptance
      await broadcastToAuction(auctionId, 'counter:response', {
        auctionId,
        accepted: true
      })

    } else {
      // Reject counter offer
      await counterOffer.update({ status: 'REJECTED' })
      await redis.set(`auction:${auctionId}:status`, 'CLOSED')
      await auction.update({ status: 'CLOSED' })

      // Broadcast rejection
      await broadcastToAuction(auctionId, 'counter:response', {
        auctionId,
        accepted: false
      })
    }

    res.json({ message: 'Counter offer response processed successfully' })
  } catch (error) {
    next(error)
  }
})

export default router