import { isAbsolute, resolve } from 'node:path'

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function resolveRuntimePath(envName: string, configuredPath: string | undefined, fallback: string): string {
  const runtimePath = process.env[`NUXT_${envName}`] ?? process.env[envName] ?? configuredPath ?? fallback

  return isAbsolute(runtimePath) ? runtimePath : resolve(process.cwd(), runtimePath)
}

export function getPzDataPath(): string {
  const config = useRuntimeConfig()
  return resolveRuntimePath('PZ_DATA_PATH', asOptionalString(config.pzDataPath), '/pz-data')
}

export function getLuaBridgePath(): string {
  const config = useRuntimeConfig()
  return resolveRuntimePath('LUA_BRIDGE_PATH', asOptionalString(config.luaBridgePath), '/lua-bridge')
}

export function getGameServerModSourcePath(): string {
  const config = useRuntimeConfig()
  return resolveRuntimePath('GAME_SERVER_MOD_SOURCE_PATH', asOptionalString(config.gameServerModSourcePath), '../lua-bridge/ZomboidManager')
}