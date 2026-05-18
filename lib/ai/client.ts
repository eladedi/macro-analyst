import Anthropic from '@anthropic-ai/sdk'

/**
 * Server-only Anthropic client. The key is read from the environment and
 * never reaches the browser (all callers are server routes / CLI).
 */
let client: Anthropic | null = null

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env.local before generating AI interpretations.')
  }
  if (!client) client = new Anthropic({ apiKey })
  return client
}

export { Anthropic }
