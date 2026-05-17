import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_0_0 = VersionInfo.of({
  version: '2026.5.0:0',
  releaseNotes:
    'Update to upstream Flowee the Hub 2026.05.0 release. ' +
    'Adds instructions.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
