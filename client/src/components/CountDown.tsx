import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface CountdownProps {
  endTime: string
  onEnd?: () => void
}

export default function Countdown({ endTime, onEnd }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft('Auction Ended')
        onEnd?.()
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endTime, onEnd])

  const isEnded = timeLeft === 'Auction Ended'

  return (
    <div className={`text-center p-4 rounded-lg ${isEnded ? 'bg-red-100' : 'bg-blue-100'}`}>
      <h3 className="text-sm font-medium text-gray-600 mb-2">
        {isEnded ? 'Status' : 'Time Remaining'}
      </h3>
      <p className={`text-2xl font-bold ${isEnded ? 'text-red-600' : 'text-blue-600'}`}>
        {timeLeft}
      </p>
    </div>
  )
}