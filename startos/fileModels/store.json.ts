import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const shape = z
  .object({
    rpcCredentials: z
      .array(
        z.object({
          name: z.string().min(1),
          username: z.string().min(1),
          password: z.string(),
        }),
      )
      .catch([]),
    rpcUser: z.string().catch('flowee'),
    rpcPassword: z.string().catch(''),
    network: z
      .enum(['mainnet', 'testnet', 'testnet4', 'scalenet', 'chipnet', 'regtest'])
      .catch('mainnet'),
    initialized: z.boolean().catch(false),
    reindex: z.boolean().catch(false),
    fullySynced: z.boolean().catch(false),
    torEnabled: z.boolean().catch(true),
    torIsolation: z.boolean().catch(true),
    advertiseClearnetInbound: z.boolean().catch(false),
  })
  .strip()

export const storeJson = FileHelper.json(
  {
    base: sdk.volumes.main,
    subpath: '/store.json',
  },
  shape,
)
