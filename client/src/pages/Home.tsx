import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import AuctionCard from '../components/AuctionCard'

export default function Home() {
  const { data: auctions, isLoading, error } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => apiClient.getAuctions(),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Loading auctions...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-red-600">Failed to load auctions</div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Live Auctions</h1>
        <p className="text-xl text-gray-600">Discover amazing items up for auction</p>
      </div>

      {auctions?.auctions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No auctions available at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions?.auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  )
}