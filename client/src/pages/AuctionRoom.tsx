import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import BidPanel from '../components/BidPanel'
import Countdown from '../components/CountDown'
import SellerDecisionModal from '../components/SellerDecisionModal'
import CounterOfferModal from '../components/CounterOfferModal'
import toast from 'react-hot-toast'

export default function AuctionRoom() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const socket = useSocket()
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [showCounterModal, setShowCounterModal] = useState(false)
  const [counterPrice, setCounterPrice] = useState(0)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => apiClient.getAuction(id!),
    enabled: !!id,
  })

  // 🔹 Custom info toast
  const showInfoToast = (message: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-md border border-blue-300`}
      >
        {message}
      </div>
    ))
  }

  useEffect(() => {
    if (!socket || !id) return

    socket.emit('auction:join', { auctionId: id })

    const handleAuctionState = (data: any) => {
      refetch()
    }

    const handleBidAccepted = (data: any) => {
      toast.success('New bid placed!')
      refetch()
    }

    const handleBidOutbid = (data: any) => {
      toast.error('You have been outbid!')
      refetch()
    }

    const handleAuctionEnded = (data: any) => {
      showInfoToast('Auction has ended!')
      refetch()
      if (user?.id === data.auction?.sellerId) {
        setShowDecisionModal(true)
      }
    }

    const handleSellerDecision = (data: any) => {
      if (data.status === 'ACCEPTED') {
        toast.success('Your bid has been accepted!')
      } else if (data.status === 'REJECTED') {
        toast.error('Your bid has been rejected')
      } else if (data.status === 'COUNTER') {
        showInfoToast('Counter offer received!')
        setCounterPrice(data.counterPrice)
        setShowCounterModal(true)
      }
      refetch()
    }

    socket.on('auction:state', handleAuctionState)
    socket.on('bid:accepted', handleBidAccepted)
    socket.on('bid:outbid', handleBidOutbid)
    socket.on('auction:ended', handleAuctionEnded)
    socket.on('seller:decision', handleSellerDecision)

    return () => {
      socket.off('auction:state', handleAuctionState)
      socket.off('bid:accepted', handleBidAccepted)
      socket.off('bid:outbid', handleBidOutbid)
      socket.off('auction:ended', handleAuctionEnded)
      socket.off('seller:decision', handleSellerDecision)
    }
  }, [socket, id, user, refetch])

  if (isLoading) return <div className="text-center">Loading auction...</div>
  if (error) return <div className="text-center text-red-600">Failed to load auction</div>
  if (!data?.auction) return <div className="text-center">Auction not found</div>

  const { auction, highestBid } = data
  const endTime = new Date(new Date(auction.goLiveAt).getTime() + auction.durationMinutes * 60000).toISOString()
  const currentHighest = highestBid?.amount || auction.startingPrice
  const minBid = currentHighest + auction.bidIncrement
  const isSeller = user?.id === auction.sellerId

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold mb-4">{auction.title}</h1>
            <p className="text-gray-600 mb-6">{auction.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-gray-500">Starting Price:</span>
                <p className="text-lg font-semibold">${auction.startingPrice}</p>
              </div>
              <div>
                <span className="text-gray-500">Bid Increment:</span>
                <p className="text-lg font-semibold">${auction.bidIncrement}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <p className="text-lg font-semibold capitalize">{auction.status.toLowerCase()}</p>
              </div>
              <div>
                <span className="text-gray-500">Duration:</span>
                <p className="text-lg font-semibold">{auction.durationMinutes} minutes</p>
              </div>
            </div>

            {auction.status === 'LIVE' && (
              <Countdown 
                endTime={endTime}
                onEnd={() => {
                  refetch()
                  if (isSeller) {
                    setShowDecisionModal(true)
                  }
                }}
              />
            )}
          </div>

          {/* Bid History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Current Highest Bid</h2>
            <div className="text-center py-8">
              <p className="text-4xl font-bold text-green-600">${currentHighest}</p>
              {highestBid && (
                <p className="text-gray-500 mt-2">
                  by {highestBid.bidder?.name || 'Anonymous'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {!isSeller && (
            <BidPanel
              auctionId={auction.id}
              currentHighest={currentHighest}
              bidIncrement={auction.bidIncrement}
              status={auction.status}
              minBid={minBid}
            />
          )}

          {isSeller && auction.status === 'ENDED' && (
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <p className="font-medium">Auction Ended</p>
              <p className="text-sm text-gray-600 mt-1">
                Highest bid: ${currentHighest}
              </p>
              <button
                onClick={() => setShowDecisionModal(true)}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Make Decision
              </button>
            </div>
          )}
        </div>
      </div>

      <SellerDecisionModal
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        auctionId={auction.id}
        highestBid={currentHighest}
      />

      <CounterOfferModal
        isOpen={showCounterModal}
        onClose={() => setShowCounterModal(false)}
        auctionId={auction.id}
        counterPrice={counterPrice}
      />
    </div>
  )
}
