import { readPreviousConsoleLog, readServerConsoleLog, tailLogText } from '../../utils/server-logs'

export default defineEventHandler(async () => {
  const containerLogs = await getContainerLogs(2000)
  const consoleLog = readServerConsoleLog()
  const previousConsole = readPreviousConsoleLog()

  const tailedConsole = tailLogText(consoleLog, 500)
  const tailedPrevious = previousConsole ? tailLogText(previousConsole, 500) : null

  return {
    containerLogs: tailLogText(containerLogs, 1500),
    serverConsole: tailedConsole,
    previousConsole: tailedPrevious && tailedPrevious !== tailedConsole ? tailedPrevious : null,
  }
})
