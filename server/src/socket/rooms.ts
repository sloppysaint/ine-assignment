import { Socket } from 'socket.io'
import { Auction } from '../models/auction'
import { Bid } from '../models/bid'
import { redis } from '../config/redis'
import { isAuctionLive, hasAuctionEnded, getAuctionEndTime } from '../utils/time'

export function handleAuctionRooms(socket: Socket) {
  socket.on('auction:join', async ({ auctionId }) => {
    try {
      const auction = await Auction.findByPk(auctionId)
      if (!auction) return

      socket.join(`auction:${auctionId}`)
      console.log(`User ${socket.data.user.name} joined auction ${auctionId}`)

      // Send current auction state
      const highestBidAmount = await redis.get(`auction:${auctionId}:highestBid`)
      const status = await redis.get(`auction:${auctionId}:status`) || auction.status
      const endTime = getAuctionEndTime(auction.goLiveAt, auction.durationMinutes)
      const timeLeftMs = Math.max(0, endTime.getTime() - Date.now())

      let highestBid = null
      if (highestBidAmount) {
        const highestBidderId = await redis.get(`auction:${auctionId}:highestBidder`)
        if (highestBidderId) {
          highestBid = await Bid.findOne({
            where: { auctionId, bidderId: highestBidderId, amount: parseInt(highestBidAmount) },
            include: [{ association: 'bidder' }]
          })
        }
      }

      socket.emit('auction:state', {
        auction: { ...auction.toJSON(), status },
        highestBid,
        timeLeftMs
      })

    } catch (error) {
      console.error('Error joining auction room:', error)
    }
  })
}

export async function broadcastToAuction(auctionId: string, event: string, data: any) {
  const { io } = await import('./index')
  io.to(`auction:${auctionId}`).emit(event, data)
}