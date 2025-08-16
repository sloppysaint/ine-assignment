
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import toast from 'react-hot-toast'

interface CounterOfferModalProps {
  isOpen: boolean
  onClose: () => void
  auctionId: string
  counterPrice: number
}

export default function CounterOfferModal({
  isOpen,
  onClose,
  auctionId,
  counterPrice,
}: CounterOfferModalProps) {
  const queryClient = useQueryClient()

  const responseMutation = useMutation({
    mutationFn: (accept: boolean) => apiClient.respondToCounter(auctionId, accept),
    onSuccess: () => {
      toast.success('Response sent successfully')
      onClose()
      queryClient.invalidateQueries(['auction', auctionId])
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Counter Offer Received</h2>
        
        <div className="mb-6">
          <p className="text-lg">
            The seller has made a counter offer of: 
            <span className="font-bold text-blue-600 ml-2">${counterPrice}</span>
          </p>
          <p className="text-gray-600 mt-2">Would you like to accept this offer?</p>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => responseMutation.mutate(true)}
            disabled={responseMutation.isLoading}
            className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
          >
            Accept
          </button>
          
          <button
            onClick={() => responseMutation.mutate(false)}
            disabled={responseMutation.isLoading}
            className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50"
          >
            Reject
          </button>
        </div>

        <button
          onClick={onClose}
          disabled={responseMutation.isLoading}
          className="w-full mt-4 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}