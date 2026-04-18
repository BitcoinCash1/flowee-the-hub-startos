import { sdk } from '../../sdk'
import { floweeConfFile, fullConfigSpec } from '../../fileModels/flowee.conf'

export const nodeSettings = sdk.Action.withInput(
  'node-settings',

  async ({ effects }) => ({
    name: 'Node Settings',
    description: 'Core node behavior and relay policy settings supported by Flowee.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),

  fullConfigSpec.filter({
    rest: true,
    blocksizeacceptlimit: true,
  }),

  async ({ effects }) => floweeConfFile.read().once(),

  async ({ effects, input }) => {
    await floweeConfFile.merge(effects, input)
    return null
  },
)
