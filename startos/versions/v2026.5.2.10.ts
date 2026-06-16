import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_2_10 = VersionInfo.of({
  version: '2026.5.2:10',
  releaseNotes: 'Transaction Indexer: declare ready at 99%+ instead of the raw <500-block gap. Once the last logged batch boundary is within 1% of the chain tip, the partial final batch is queued and the index is functionally complete.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
