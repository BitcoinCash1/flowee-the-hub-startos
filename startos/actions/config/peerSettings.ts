import { floweeConfFile, fullConfigSpec } from '../../fileModels/flowee.conf'
import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const peerSettings = sdk.Action.withInput(
  'peer-settings',

  async () => ({
    name: i18n('Peer & Privacy Settings'),
    description: i18n(
      'Edit how the node connects to peers, what it advertises about itself, and whether that traffic goes through Tor',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  fullConfigSpec.filter({
    torProxyAll: true,
    torIsolation: true,
    advertiseClearnetInbound: true,
    onlynet: true,
    maxconnections: true,
    addnode: true,
    maxuploadtarget: true,
    maxreceivebuffer: true,
    maxsendbuffer: true,
    rpcthreads: true,
  }),

  // The three privacy toggles are package state rather than hub settings, so
  // they come from store.json and are laid over the form.
  async () => ({
    ...(await floweeConfFile.read().once()),
    ...(await storeJson.read().once()),
  }),

  async ({ effects, input }) => {
    const { torProxyAll, torIsolation, advertiseClearnetInbound, ...conf } =
      input
    await floweeConfFile.merge(effects, conf)
    await storeJson.merge(effects, {
      torProxyAll,
      torIsolation,
      advertiseClearnetInbound,
    })
  },
)
