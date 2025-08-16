import  { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import toast from 'react-hot-toast'

interface SellerDecisionModalProps {
  isOpen: boolean
  onClose: () => void
  auctionId: string
  highestBid: number
}

export default function SellerDecisionModal({
  isOpen,
  onClose,
  auctionId,
  highestBid,
}: SellerDecisionModalProps) {
  const [counterPrice, setCounterPrice] = useState(highestBid)
  const queryClient = useQueryClient()

  const decisionMutation = useMutation({
    mutationFn: ({ action, counterPrice }: { action: 'ACCEPT' | 'REJECT' | 'COUNTER'; counterPrice?: number }) =>
      apiClient.makeDecision(auctionId, action, counterPrice),
    onSuccess: () => {
      toast.success('Decision sent successfully')
      onClose()
      queryClient.invalidateQueries(['auction', auctionId])
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleDecision = (action: 'ACCEPT' | 'REJECT' | 'COUNTER') => {
    if (action === 'COUNTER') {
      decisionMutation.mutate({ action, counterPrice })
    } else {
      decisionMutation.mutate({ action })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Auction Decision</h2>
        
        <div className="mb-6">
          <p className="text-lg">Highest Bid: <span className="font-bold text-green-600">${highestBid}</span></p>
          <p className="text-gray-600 mt-2">What would you like to do?</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleDecision('ACCEPT')}
            disabled={decisionMutation.isLoading}
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
          >
            Accept Bid
          </button>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Counter Offer ($)</label>
            <input
              type="number"
              value={counterPrice}
              onChange={(e) => setCounterPrice(Number(e.target.value))}
              className="w-full p-2 border rounded"
              min={highestBid}
            />
            <button
              onClick={() => handleDecision('COUNTER')}
              disabled={decisionMutation.isLoading || counterPrice <= highestBid}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Send Counter Offer
            </button>
          </div>

          <button
            onClick={() => handleDecision('REJECT')}
            disabled={decisionMutation.isLoading}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50"
          >
            Reject Bid
          </button>

          <button
            onClick={onClose}
            disabled={decisionMutation.isLoading}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}