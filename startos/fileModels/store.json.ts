import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { NETWORKS } from '../utils'

export const shape = z.object({
  network: z.enum(NETWORKS).catch('mainnet'),
  reindex: z.boolean().catch(false),
  fullySynced: z.boolean().catch(false),
  torProxyAll: z.boolean().catch(false),
  torIsolation: z.boolean().catch(true),
  advertiseClearnetInbound: z.boolean().catch(false),
  // Written by versions before 2026.5.2:12, two of them holding an RPC
  // password in plaintext. A file model preserves keys it was never told
  // about, so they are declared here to be removed: whatever is on disk parses
  // to undefined and the next write omits it.
  rpcCredentials: z.undefined().optional().catch(undefined),
  rpcUser: z.undefined().optional().catch(undefined),
  rpcPassword: z.undefined().optional().catch(undefined),
  initialized: z.undefined().optional().catch(undefined),
  torEnabled: z.undefined().optional().catch(undefined),
})

export const storeJson = FileHelper.json(
  {
    base: sdk.volumes.main,
    subpath: '/store.json',
  },
  shape,
)
