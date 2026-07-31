import { floweeConfFile, fullConfigSpec } from '../../fileModels/flowee.conf'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const nodeSettings = sdk.Action.withInput(
  'node-settings',

  async () => ({
    name: i18n('Node Settings'),
    description: i18n('Edit block policy and the optional REST API'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  fullConfigSpec.filter({
    rest: true,
    blocksizeacceptlimit: true,
  }),

  async () => floweeConfFile.read().once(),

  async ({ effects, input }) => floweeConfFile.merge(effects, input),
)
