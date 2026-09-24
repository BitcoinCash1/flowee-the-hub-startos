import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  const torProxyAll = await storeJson.read((s) => s.torProxyAll).const(effects)

  // Tor matters only as the SOCKS proxy peer traffic is sent through. The hub
  // predates v3 onion addresses, so it is never needed for onion reachability.
  return torProxyAll
    ? {
        tor: {
          kind: 'running' as const,
          versionRange: '>=0.4.9.11:4',
          healthChecks: [],
        },
      }
    : {}
})
