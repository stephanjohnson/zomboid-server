import { isAbsolute, resolve } from 'node:path'

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function hasValue(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0
}

function isLocalDevRuntime(): boolean {
  return process.env.NODE_ENV !== 'production' && !process.env.DOCKER_CONTAINER
}

function resolveRuntimePath(envName: string, configuredPath: string | undefined, fallback: string): string {
  const runtimePath = process.env[`NUXT_${envName}`] ?? process.env[envName] ?? configuredPath ?? fallback

  return isAbsolute(runtimePath) ? runtimePath : resolve(process.cwd(), runtimePath)
}

function resolveMountSource(configuredSource: string | undefined, fallback: string): string {
  const mountSource = hasValue(configuredSource) ? configuredSource : fallback

  if (mountSource.includes('/') || mountSource.startsWith('.')) {
    return isAbsolute(mountSource) ? mountSource : resolve(process.cwd(), mountSource)
  }

  return mountSource
}

export function getPzDataPath(): string {
  const config = useRuntimeConfig()
  const localDev = isLocalDevRuntime()
  const configuredPath = asOptionalString(config.pzDataPath)
  const fallback = localDev ? './dev-data/pzm-data' : '/pzm-data'

  if (localDev && (!configuredPath || configuredPath === '/pzm-data' || configuredPath === '/pz-data')) {
    return resolve(process.cwd(), fallback)
  }

  return resolveRuntimePath('PZ_DATA_PATH', configuredPath, fallback)
}

export function getLuaBridgePath(): string {
  const config = useRuntimeConfig()
  const localDev = isLocalDevRuntime()
  const configuredPath = asOptionalString(config.luaBridgePath)
  const fallback = localDev ? './dev-data/lua-bridge' : '/lua-bridge'

  if (localDev && (!configuredPath || configuredPath === '/lua-bridge')) {
    return resolve(process.cwd(), fallback)
  }

  return resolveRuntimePath('LUA_BRIDGE_PATH', configuredPath, fallback)
}

export function getGameServerModSourcePath(): string {
  const config = useRuntimeConfig()
  return resolveRuntimePath('GAME_SERVER_MOD_SOURCE_PATH', asOptionalString(config.gameServerModSourcePath), '../lua-bridge/ZomboidManager')
}

export function getGameServerDataMountSource(): string {
  const config = useRuntimeConfig()
  const configuredSource = asOptionalString(config.gameServerDataMountSource)
    ?? asOptionalString(process.env.NUXT_GAME_SERVER_DATA_MOUNT_SOURCE)
    ?? asOptionalString(process.env.GAME_SERVER_DATA_MOUNT_SOURCE)

  return resolveMountSource(
    configuredSource,
    isLocalDevRuntime() ? './dev-data/pzm-data' : 'pzm-data',
  )
}

export function getGameServerLuaBridgeMountSource(): string {
  const config = useRuntimeConfig()
  const configuredSource = asOptionalString(config.gameServerLuaBridgeMountSource)
    ?? asOptionalString(process.env.NUXT_GAME_SERVER_LUA_BRIDGE_MOUNT_SOURCE)
    ?? asOptionalString(process.env.GAME_SERVER_LUA_BRIDGE_MOUNT_SOURCE)

  return resolveMountSource(
    configuredSource,
    isLocalDevRuntime() ? './dev-data/lua-bridge' : 'pzm-lua-bridge',
  )
}

export function getGameServerModSourceMount(): string | undefined {
  const config = useRuntimeConfig()
  const configuredSource = asOptionalString(config.gameServerModSourceMount)
    ?? asOptionalString(process.env.NUXT_GAME_SERVER_MOD_SOURCE_MOUNT)
    ?? asOptionalString(process.env.GAME_SERVER_MOD_SOURCE_MOUNT)

  if (hasValue(configuredSource)) {
    return resolveMountSource(configuredSource, configuredSource)
  }

  if (isLocalDevRuntime()) {
    return resolve(process.cwd(), '../lua-bridge/ZomboidManager')
  }

  return undefined
}
