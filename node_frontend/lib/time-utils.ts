/**
 * Formats an ISO timestamp to "X daqiqa oldin", "X soat oldin", etc. in Uzbek
 * 
 * @param timestamp - ISO timestamp string
 * @returns Formatted time ago string, or "hozir" if timestamp is invalid
 */
export function formatTimeAgo(timestamp: string): string {
  // Validate timestamp before parsing
  if (!timestamp || typeof timestamp !== 'string') {
    return "hozir"
  }

  const now = new Date()
  const past = new Date(timestamp)
  
  // Check if date parsing resulted in invalid date
  if (isNaN(past.getTime())) {
    return "hozir"
  }
  
  const diffInMs = now.getTime() - past.getTime()
  const diffInSeconds = Math.floor(diffInMs / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) {
    return "hozir"
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} daqiqa oldin`
  } else if (diffInHours < 24) {
    return `${diffInHours} soat oldin`
  } else if (diffInDays < 30) {
    return `${diffInDays} kun oldin`
  } else {
    const diffInMonths = Math.floor(diffInDays / 30)
    return `${diffInMonths} oy oldin`
  }
}

