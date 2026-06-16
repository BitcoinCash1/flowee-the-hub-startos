import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_2_6 = VersionInfo.of({
  version: '2026.5.2:6',
  releaseNotes: 'Remove dead getrawtransaction RPC test from Transaction Indexer health check: hub-cli getrawtransaction only queries the mempool, not the indexer. The indexedBlock >= chainTip check is the correct completion signal.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
