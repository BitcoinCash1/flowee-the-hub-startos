import { VersionInfo } from '@start9labs/start-sdk'

export const v_2026_5_3_0 = VersionInfo.of({
  version: '2026.5.3:0',
  releaseNotes:
    'Restore the pre-:12 dependent contract: per-network RPC/P2P ports ' +
    '(chipnet 48332/48333, same as BCHN) and plaintext RPC credentials in ' +
    'store.json / flowee.conf so Fulcrum, Explorer, and pools can autoconfig. ' +
    'StartOS-Community 2026.5.2:12 pinned every network to 8332 and stripped ' +
    'passwords, which broke those services. This package is the last known-' +
    'good BitcoinCash1 Flowee (2026.5.2:11 behavior) with a newer version so ' +
    'it can replace :12.',
  migrations: {
    up: async () => {},
    down: async () => {},
  },
})
