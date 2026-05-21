const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

function getApiOrigin(): string {
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    return new URL(API_BASE_URL).origin
  }
  return ''
}

export function resolveImageUrl(imageUrl?: string | null): string | undefined {
  if (!imageUrl) return undefined
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  if (imageUrl.startsWith('/static/')) return `${getApiOrigin()}${imageUrl}`
  return imageUrl
}
