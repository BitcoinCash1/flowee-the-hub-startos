import { floweeConfFile, fullConfigSpec } from '../../fileModels/flowee.conf'
import { sdk } from '../../sdk'

export const settings = sdk.Action.withInput(
  'settings',

  async ({ effects }) => ({
    name: 'Node Settings',
    description: 'Configure Flowee node settings, network behavior, and RPC tuning.',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects, prefill }) => {
    if (!prefill) return fullConfigSpec
    return fullConfigSpec
  },

  async ({ effects }) => floweeConfFile.read().once(),

  ({ effects, input }) => floweeConfFile.merge(effects, input),
)
