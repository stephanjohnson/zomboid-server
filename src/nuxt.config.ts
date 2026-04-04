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
  ],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  runtimeConfig: {
    // Private (server-only) — set via NUXT_ env vars
    appSecret: process.env.APP_SECRET || 'dev-secret',
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',

    databaseUrl: process.env.DATABASE_URL || 'postgresql://zomboid:zomboid@localhost:5432/zomboid',

    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://zomboid:zomboid@localhost:5672',

    dockerProxyUrl: process.env.DOCKER_PROXY_URL || 'http://localhost:2375',
    gameServerContainerName: process.env.GAME_SERVER_CONTAINER_NAME || 'pz-game-server',

    pzRconHost: process.env.PZ_RCON_HOST || 'localhost',
    pzRconPort: Number(process.env.PZ_RCON_PORT) || 27015,
    pzRconPassword: process.env.PZ_RCON_PASSWORD || '',

    pzDataPath: process.env.PZ_DATA_PATH || '/pz-data',
    pzServerPath: process.env.PZ_SERVER_PATH || '/pz-server',
    backupPath: process.env.BACKUP_PATH || '/backups',
    luaBridgePath: process.env.LUA_BRIDGE_PATH || '/lua-bridge',

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
