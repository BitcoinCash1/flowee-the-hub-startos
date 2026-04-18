import { sdk } from '../../sdk'
import { floweeConfFile, fullConfigSpec } from '../../fileModels/flowee.conf'

export const rpcPeersSettings = sdk.Action.withInput(
  'rpc-peers-settings',

  async ({ effects }) => ({
    name: 'RPC & Peers Settings',
    description: 'Configure RPC threading and peer connectivity settings.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),

  fullConfigSpec.filter({
    rpcthreads: true,
    maxconnections: true,
    onlynet: true,
    addnode: true,
  }),

  async ({ effects }) => floweeConfFile.read().once(),

  async ({ effects, input }) => {
    await floweeConfFile.merge(effects, input)
    return null
  },
)
