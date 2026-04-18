import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const shape = z
  .object({
    rpcUser: z.string().catch('flowee'),
    rpcPassword: z.string().catch(''),
    initialized: z.boolean().catch(false),
    reindex: z.boolean().catch(false),
    fullySynced: z.boolean().catch(false),
  })
  .strip()

export const storeJson = FileHelper.json(
  {
    base: sdk.volumes.main,
    subpath: '/store.json',
  },
  shape,
)
