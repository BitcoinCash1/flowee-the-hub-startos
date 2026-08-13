import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_2_13 = VersionInfo.of({
  version: '2026.5.2:13',
  releaseNotes:
    'Still upstream Flowee the Hub 2026.05.2 (no 2026.05.3/2026.05.4 exists). ' +
    'Packaging revision after 2026.5.2:12. Restores per-network RPC/P2P ports ' +
    '(chipnet 48332/48333) and plaintext RPC credentials for dependents. ' +
    '2026.5.3:0 and 2026.5.4:0 were sideload-only invented upstream numbers ' +
    'for the same hub tag — this is the correct 2026.5.2:N line.',
  migrations: {
    up: async () => {},
    down: async () => {},
  },
})
