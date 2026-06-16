import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_2_9 = VersionInfo.of({
  version: '2026.5.2:9',
  releaseNotes: 'Transaction Indexer: declare ready when fewer than 500 blocks remain (one batch). The 9-minute delay at the last batch boundary is Flowee\'s internal batch timeout — the partial batch is already queued at that point.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
