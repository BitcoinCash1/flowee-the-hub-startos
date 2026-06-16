import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_2_11 = VersionInfo.of({
  version: '2026.5.2:11',
  releaseNotes: 'Transaction Indexer: fix "stuck building" after a clean restart. Now reads TxDB checkpoint height from the startup log line so the health check can report progress (and declare ready) even when no "Processing block" entries appear because the index was already at chain tip.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
