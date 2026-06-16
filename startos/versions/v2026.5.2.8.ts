import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_2_8 = VersionInfo.of({
  version: '2026.5.2:8',
  releaseNotes: 'Fix Transaction Indexer completion detection: look for Flowee\'s actual "Reached top of chain" log message instead of a block-count threshold. Revert the incorrect <500-block heuristic from v2026.5.2:7.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
