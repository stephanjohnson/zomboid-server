const readRuntimeEnv = (name: string, fallback: string) => process.env[`NUXT_${name}`] ?? process.env[name] ?? fallback

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxtjs/i18n',
    '@nuxtjs/color-mode',
    '@nuxt/eslint',
    'nuxt-auth-utils',
  ],

  // https://nuxt.com/modules/color-mode
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
  },

  // https://nuxt.com/modules/fonts
  fonts: {
    families: [
      { name: 'Inter', provider: 'google', global: true },
    ],
    provider: 'google',
  },

  // https://nuxt.com/modules/i18n
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },

  // https://nuxt.com/modules/icon
  icon: {},

  // https://nuxt.com/modules/shadcn
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },

  runtimeConfig: {
    // Private (server-only)
    appSecret: readRuntimeEnv('APP_SECRET', 'dev-secret'),

    databaseUrl: readRuntimeEnv('DATABASE_URL', 'postgresql://zomboid:zomboid@localhost:5432/zomboid'),

    rabbitmqUrl: readRuntimeEnv('RABBITMQ_URL', 'amqp://zomboid:zomboid@localhost:5672'),

    dockerProxyUrl: readRuntimeEnv('DOCKER_PROXY_URL', 'http://localhost:2375'),
    gameServerContainerName: readRuntimeEnv('GAME_SERVER_CONTAINER_NAME', 'pzm-game-server'),
    gameServerImageName: readRuntimeEnv('GAME_SERVER_IMAGE', 'pzm-game-server:local'),
    gameServerNetworkName: readRuntimeEnv('GAME_SERVER_NETWORK_NAME', 'zomboid-server_zomboid-net'),
    gameServerNetworkAlias: readRuntimeEnv('GAME_SERVER_NETWORK_ALIAS', 'game-server'),
    gameServerDataMountSource: readRuntimeEnv('GAME_SERVER_DATA_MOUNT_SOURCE', ''),
    gameServerLuaBridgeMountSource: readRuntimeEnv('GAME_SERVER_LUA_BRIDGE_MOUNT_SOURCE', ''),
    gameServerServerFilesMountSource: readRuntimeEnv('GAME_SERVER_SERVER_FILES_MOUNT_SOURCE', ''),
    gameServerModSourceMount: readRuntimeEnv('GAME_SERVER_MOD_SOURCE_MOUNT', ''),
    gameServerModSourcePath: readRuntimeEnv('GAME_SERVER_MOD_SOURCE_PATH', '../lua-bridge/ZomboidManager'),
    modApiBaseUrl: readRuntimeEnv('MOD_API_BASE_URL', 'http://nitro-app:3000/api/mod'),

    pzRconHost: readRuntimeEnv('PZ_RCON_HOST', 'localhost'),
    pzRconPort: Number(readRuntimeEnv('PZ_RCON_PORT', '27015')),
    pzRconPassword: readRuntimeEnv('PZ_RCON_PASSWORD', ''),

    pzDataPath: readRuntimeEnv('PZ_DATA_PATH', '/pzm-data'),
    pzServerPath: readRuntimeEnv('PZ_SERVER_PATH', '/pzm-server'),
    backupPath: readRuntimeEnv('BACKUP_PATH', '/backups'),
    luaBridgePath: readRuntimeEnv('LUA_BRIDGE_PATH', '/lua-bridge'),

    public: {
      appName: 'Zomboid Server Manager',
    },
  },

  typescript: {
    strict: true,
  },

  routeRules: {
    '/api/**': { cors: true },
    '/admin/**': { ssr: false },
  },

  app: {
    head: {
      title: 'Zomboid Server Manager',
      titleTemplate: '%s - Zomboid Server Manager',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    },
  },

  nitro: {
    experimental: {
      websocket: true,
    },
  },
})
