import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(async () => {
  const containerLogs = await getContainerLogs(300)

  const config = useRuntimeConfig()
  const consolePath = join(String(config.pzDataPath || '/pzm-data'), 'server-console.txt')
  const consoleLog = existsSync(consolePath) ? readFileSync(consolePath, 'utf-8') : ''

  return {
    containerLogs,
    serverConsole: consoleLog,
  }
})
