import { floweeConfFile, fullConfigSpec } from '../../fileModels/flowee.conf'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const mempoolSettings = sdk.Action.withInput(
  'mempool-settings',

  async () => ({
    name: i18n('Mempool Settings'),
    description: i18n('Edit mempool limits and relay fee policy'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  fullConfigSpec.filter({
    maxmempool: true,
    minrelaytxfee: true,
    mempoolexpiry: true,
    maxorphantx: true,
  }),

  async () => floweeConfFile.read().once(),

  async ({ effects, input }) => floweeConfFile.merge(effects, input),
)
