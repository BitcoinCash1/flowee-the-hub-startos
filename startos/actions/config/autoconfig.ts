import { floweeConfFile, fullConfigSpec } from '../../fileModels/flowee.conf'
import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const autoconfig = sdk.Action.withInput(
  'autoconfig',

  async () => ({
    name: i18n('Auto-Configure'),
    description: i18n(
      'Automatically configure flowee.conf for the needs of another service',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'hidden',
  }),

  async ({ prefill }) => {
    if (!prefill) return fullConfigSpec

    return fullConfigSpec
      .filterFromPartial(prefill as typeof fullConfigSpec._PARTIAL)
      .disableFromPartial(
        prefill as typeof fullConfigSpec._PARTIAL,
        i18n('These fields were provided by a task and cannot be edited'),
      )
  },

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
