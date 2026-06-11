import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_2_5 = VersionInfo.of({
  version: '2026.5.2:5',
  releaseNotes: 'Fix Transaction Indexer stuck at 100%: declare ready when indexed block reaches chain tip, without waiting for RPC getrawtransaction test.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
