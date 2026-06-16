import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_2_7 = VersionInfo.of({
  version: '2026.5.2:7',
  releaseNotes: 'Fix Transaction Indexer stuck at 99%: Flowee logs every 500 blocks, so the final sub-500-block stretch produces no new log entry. Declare ready when the remaining gap is less than 500 blocks.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
