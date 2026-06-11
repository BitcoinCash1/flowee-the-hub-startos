import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_2_2 = VersionInfo.of({
  version: '2026.5.2:2',
  releaseNotes: 'Show active network (Mainnet/Chipnet/etc.) in Blockchain Sync health check.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
