/**
 * Get online players via RCON.
 */
export default defineEventHandler(async () => {
  try {
    const response = await sendRconCommand('players')
    // Parse the RCON response into a player list
    const lines = response.split('\n').filter(l => l.trim())
    const players = lines
      .filter(l => l.startsWith('-'))
      .map(l => l.replace(/^-\s*/, '').trim())

    return { players, count: players.length }
  }
  catch {
    return { players: [], count: 0, offline: true }
  }
})
