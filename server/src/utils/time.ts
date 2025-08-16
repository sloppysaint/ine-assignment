export function isAuctionLive(goLiveAt: Date, durationMinutes: number): boolean {
  const now = new Date()
  const endTime = new Date(goLiveAt.getTime() + durationMinutes * 60000)
  return now >= goLiveAt && now < endTime
}

export function getAuctionEndTime(goLiveAt: Date, durationMinutes: number): Date {
  return new Date(goLiveAt.getTime() + durationMinutes * 60000)
}

export function hasAuctionEnded(goLiveAt: Date, durationMinutes: number): boolean {
  const now = new Date()
  const endTime = getAuctionEndTime(goLiveAt, durationMinutes)
  return now >= endTime
}