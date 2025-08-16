const API_BASE = '/api'

export interface User {
  id: string
  name: string
  email: string
  role: string
}

export interface Auction {
  id: string
  sellerId: string
  title: string
  description: string
  startingPrice: number
  bidIncrement: number
  goLiveAt: string
  durationMinutes: number
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CLOSED'
  createdAt: string
  updatedAt: string
  seller?: User
}

export interface Bid {
  id: string
  auctionId: string
  bidderId: string
  amount: number
  createdAt: string
  bidder?: User
}

export interface Notification {
  id: string
  userId: string
  type: string
  payload: any
  read: boolean
  createdAt: string
}

class ApiClient {
  private request = async <T>(url: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE}${url}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || 'Request failed')
    }

    return response.json()
  }

  // Auth
  signup = async (data: { name: string; email: string; password: string }) => {
    return this.request<{ user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  login = async (data: { email: string; password: string }) => {
    return this.request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  logout = async () => {
    return this.request('/auth/logout', { method: 'POST' })
  }

  getMe = async () => {
    return this.request<{ user: User }>('/auth/me')
  }

  // Auctions
  getAuctions = async () => {
    return this.request<{ auctions: Auction[] }>('/auctions')
  }

  getAuction = async (id: string) => {
    return this.request<{ auction: Auction; highestBid?: Bid }>(`/auctions/${id}`)
  }

  createAuction = async (data: {
    title: string
    description: string
    startingPrice: number
    bidIncrement: number
    goLiveAt: string
    durationMinutes: number
  }) => {
    return this.request<{ auction: Auction }>('/auctions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  placeBid = async (auctionId: string, amount: number) => {
    return this.request<{ bid: Bid }>(`/auctions/${auctionId}/bids`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  }

  makeDecision = async (auctionId: string, action: 'ACCEPT' | 'REJECT' | 'COUNTER', counterPrice?: number) => {
    return this.request(`/auctions/${auctionId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ action, counterPrice }),
    })
  }

  respondToCounter = async (auctionId: string, accept: boolean) => {
    return this.request(`/auctions/${auctionId}/counter/response`, {
      method: 'POST',
      body: JSON.stringify({ accept }),
    })
  }

  // Notifications
  getNotifications = async () => {
    return this.request<{ notifications: Notification[] }>('/notifications')
  }

  markNotificationRead = async (id: string) => {
    return this.request(`/notifications/${id}/read`, { method: 'POST' })
  }
}

export const apiClient = new ApiClient()
