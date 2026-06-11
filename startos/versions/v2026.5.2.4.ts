import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_2_4 = VersionInfo.of({
  version: '2026.5.2:4',
  releaseNotes: 'Transaction Indexer health check now shows percentage progress: "block 305000/309751 (98%)".',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
