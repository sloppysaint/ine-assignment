import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import AuctionCard from '../components/AuctionCard'

export default function MyAuctions() {
  const { id } = useParams<{ id: string }>()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => apiClient.getAuctions(),
  })

  if (isLoading) return <div className="text-center">Loading your auctions...</div>
  if (error) return <div className="text-center text-red-600">Failed to load auctions</div>

  const userAuctions = data?.auctions.filter(auction => auction.sellerId === id) || []

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Auctions</h1>
      
      {userAuctions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">You haven't created any auctions yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userAuctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  )
}