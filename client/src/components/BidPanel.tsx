import  { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface BidPanelProps {
  auctionId: string
  currentHighest: number
  bidIncrement: number
  status: string
  minBid: number
}

export default function BidPanel({ 
  auctionId, 
  currentHighest, 
  bidIncrement, 
  status,
  minBid 
}: BidPanelProps) {
  const [bidAmount, setBidAmount] = useState(minBid)
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const bidMutation = useMutation({
    mutationFn: (amount: number) => apiClient.placeBid(auctionId, amount),
    onSuccess: () => {
      toast.success('Bid placed successfully!')
      setBidAmount(minBid)
      queryClient.invalidateQueries(['auction', auctionId])
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (bidAmount >= minBid) {
      bidMutation.mutate(bidAmount)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <p className="text-gray-600">Please log in to place bids</p>
      </div>
    )
  }

  if (status !== 'LIVE') {
    return (
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <p className="text-gray-600">Auction is not currently active</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Place Your Bid</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Current Highest Bid</p>
        <p className="text-2xl font-bold text-green-600">${currentHighest}</p>
      </div>

      <form onSubmit={handleBidSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Bid (min: ${minBid})
          </label>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(Number(e.target.value))}
            min={minBid}
            step={bidIncrement}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={bidMutation.isLoading || bidAmount < minBid}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bidMutation.isLoading ? 'Placing Bid...' : `Bid $${bidAmount}`}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-2">
        Next minimum bid: ${currentHighest + bidIncrement}
      </p>
    </div>
  )
}