import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_1_1 = VersionInfo.of({
  version: '2026.5.1:1',
  releaseNotes:
    'Add Network configuration (mainnet/testnet3/testnet4/scalenet/chipnet/regtest), ' +
    'Delete Peer List, Delete Test Network Data, and Delete Transaction Index actions. ' +
    'Add Max Orphan Transactions to Mempool settings.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
