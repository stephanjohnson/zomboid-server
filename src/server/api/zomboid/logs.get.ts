import { formatLogForDisplay, readPreviousConsoleLog, readServerConsoleLog, tailLogText } from '../../utils/server-logs'

export default defineEventHandler(async () => {
  const containerLogs = await getContainerLogs(2000)
  const consoleLog = readServerConsoleLog()
  const previousConsole = readPreviousConsoleLog()

  const tailedConsole = tailLogText(consoleLog, 500)
  const tailedPrevious = previousConsole ? tailLogText(previousConsole, 500) : null

  return {
    containerLogs: formatLogForDisplay(tailLogText(containerLogs, 1500)),
    serverConsole: formatLogForDisplay(tailedConsole),
    previousConsole: tailedPrevious && tailedPrevious !== tailedConsole ? formatLogForDisplay(tailedPrevious) : null,
  }
})
