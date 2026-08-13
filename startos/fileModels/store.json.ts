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
  // Dependents that predate createDependentCredential still read these.
  // :12 stripped them, which broke Fulcrum / Explorer / pools that expected
  // plaintext creds in store.json. Hashed rpcauth for hub-cli is unchanged.
  rpcUser: z.string().optional(),
  rpcPassword: z.string().optional(),
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
