
import { Link } from 'react-router-dom'
import { Auction } from '../api/client'
import { format } from 'date-fns'

interface AuctionCardProps {
  auction: Auction
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800'
      case 'LIVE': return 'bg-green-100 text-green-800'
      case 'ENDED': return 'bg-blue-100 text-blue-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{auction.title}</h3>
        <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(auction.status)}`}>
          {auction.status}
        </span>
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-3">{auction.description}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Starting Price:</span>
          <p className="font-semibold">${auction.startingPrice}</p>
        </div>
        <div>
          <span className="text-gray-500">Bid Increment:</span>
          <p className="font-semibold">${auction.bidIncrement}</p>
        </div>
        <div>
          <span className="text-gray-500">Goes Live:</span>
          <p className="font-semibold">{format(new Date(auction.goLiveAt), 'MMM d, h:mm a')}</p>
        </div>
        <div>
          <span className="text-gray-500">Duration:</span>
          <p className="font-semibold">{auction.durationMinutes} min</p>
        </div>
      </div>

      <Link
        to={`/auction/${auction.id}`}
        className="block w-full bg-blue-500 text-white text-center py-2 rounded hover:bg-blue-600 transition-colors"
      >
        View Auction
      </Link>
    </div>
  )
}