import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_2_3 = VersionInfo.of({
  version: '2026.5.2:3',
  releaseNotes: 'Transaction Indexer health check now shows build progress and confirms index is ready via RPC, instead of just reporting the process is running.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
