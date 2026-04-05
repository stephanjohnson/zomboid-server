import { deletePreviousConsoleLog } from '../../../utils/server-logs'

export default defineEventHandler(() => {
  const deleted = deletePreviousConsoleLog()
  return { deleted }
})
