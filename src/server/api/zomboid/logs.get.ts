import { readPreviousConsoleLog, readServerConsoleLog, tailLogText } from '../../utils/server-logs'

export default defineEventHandler(async () => {
  const containerLogs = await getContainerLogs(2000)
  const consoleLog = readServerConsoleLog()
  const previousConsole = readPreviousConsoleLog()

  return {
    containerLogs: tailLogText(containerLogs, 1500),
    serverConsole: tailLogText(consoleLog, 500),
    previousConsole: previousConsole ? tailLogText(previousConsole, 500) : null,
  }
})
