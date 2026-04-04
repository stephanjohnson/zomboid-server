const readRuntimeEnv = (name: string, fallback: string) => process.env[`NUXT_${name}`] ?? process.env[name] ?? fallback

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  future: {
    compatibilityVersion: 4,
  },

  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@nuxt/eslint',
    'nuxt-auth-utils',
  ],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  runtimeConfig: {
    // Private (server-only)
    appSecret: readRuntimeEnv('APP_SECRET', 'dev-secret'),

    databaseUrl: readRuntimeEnv('DATABASE_URL', 'postgresql://zomboid:zomboid@localhost:5432/zomboid'),

    rabbitmqUrl: readRuntimeEnv('RABBITMQ_URL', 'amqp://zomboid:zomboid@localhost:5672'),

    dockerProxyUrl: readRuntimeEnv('DOCKER_PROXY_URL', 'http://localhost:2375'),
    gameServerContainerName: readRuntimeEnv('GAME_SERVER_CONTAINER_NAME', 'pz-game-server'),

    pzRconHost: readRuntimeEnv('PZ_RCON_HOST', 'localhost'),
    pzRconPort: Number(readRuntimeEnv('PZ_RCON_PORT', '27015')),
    pzRconPassword: readRuntimeEnv('PZ_RCON_PASSWORD', ''),

    pzDataPath: readRuntimeEnv('PZ_DATA_PATH', '/pz-data'),
    pzServerPath: readRuntimeEnv('PZ_SERVER_PATH', '/pz-server'),
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
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  nitro: {
    experimental: {
      websocket: true,
    },
  },
})
