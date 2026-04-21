import { sdk } from '../../sdk'
import { floweeConfFile, fullConfigSpec } from '../../fileModels/flowee.conf'
import { storeJson } from '../../fileModels/store.json'

export const rpcPeersSettings = sdk.Action.withInput(
  'rpc-peers-settings',

  async ({ effects }) => ({
    name: 'RPC & Peers Settings',
    description: 'Configure RPC threading, Tor routing, and peer connectivity settings.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),

  fullConfigSpec.filter({
    torEnabled: true,
    torIsolation: true,
    onlynet: true,
    onionOnly: true,
    advertiseClearnetInbound: true,
    rpcthreads: true,
    maxconnections: true,
    maxuploadtarget: true,
    maxreceivebuffer: true,
    maxsendbuffer: true,
    addnode: true,
  }),

  async ({ effects }) => {
    const conf = await floweeConfFile.read().once()
    const store = await storeJson.read().once()
    return {
      ...conf,
      torEnabled: store?.torEnabled ?? true,
      torIsolation: store?.torIsolation ?? true,
      advertiseClearnetInbound: store?.advertiseClearnetInbound ?? false,
    }
  },

  async ({ effects, input }) => {
    const { torEnabled, torIsolation, advertiseClearnetInbound, ...confInput } = input as any
    await floweeConfFile.merge(effects, confInput)
    await storeJson.merge(effects, {
      torEnabled: torEnabled ?? true,
      torIsolation: torIsolation ?? true,
      advertiseClearnetInbound: !!advertiseClearnetInbound,
    })
    return null
  },
)
