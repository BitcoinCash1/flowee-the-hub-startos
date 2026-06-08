import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_2_1 = VersionInfo.of({
  version: '2026.5.2:1',
  releaseNotes: 'Fix network switch: auto-restart after network change via effects.restart().',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
