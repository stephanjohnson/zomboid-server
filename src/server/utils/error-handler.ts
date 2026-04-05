import { H3Error } from 'h3'

export function handleApiError(error: unknown, fallback: { statusCode?: number, message: string }): never {
  // Re-throw existing H3 errors
  if (error instanceof H3Error) throw error

  console.error('[api-error]', error)

  const causeMessage = error instanceof Error ? error.message : String(error)

  // Generic fallback
  throw createError({
    statusCode: fallback.statusCode ?? 500,
    message: process.env.NODE_ENV === 'production'
      ? fallback.message
      : `${fallback.message}: ${causeMessage}`,
  })
}
