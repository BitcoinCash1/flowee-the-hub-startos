import { VersionInfo } from '@start9labs/start-sdk'

export const v_1_0_0_0 = VersionInfo.of({
  version: '1.0.0:0',
  releaseNotes: 'Initial release for StartOS 040. Flowee the Hub 2026.02.0.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
