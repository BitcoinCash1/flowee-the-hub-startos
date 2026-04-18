import { sdk } from '../../sdk'
import { floweeConfFile, fullConfigSpec } from '../../fileModels/flowee.conf'

export const mempoolSettings = sdk.Action.withInput(
  'mempool-settings',

  async ({ effects }) => ({
    name: 'Mempool & Block Policy',
    description:
      'Configure mempool limits, relay fee policy, and transaction retention settings.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),

  fullConfigSpec.filter({
    maxmempool: true,
    minrelaytxfee: true,
    mempoolexpiry: true,
  }),

  async ({ effects }) => floweeConfFile.read().once(),

  async ({ effects, input }) => {
    await floweeConfFile.merge(effects, input)
    return null
  },
)
