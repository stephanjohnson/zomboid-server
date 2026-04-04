export default defineEventHandler((event) => {
  logger.info(`${event.method} ${event.path}`)
})
