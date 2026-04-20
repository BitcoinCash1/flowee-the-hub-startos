import { floweeConfFile, fullConfigSpec } from '../../fileModels/flowee.conf'
import { storeJson } from '../../fileModels/store.json'
import { sdk } from '../../sdk'

export const autoconfig = sdk.Action.withInput(
  'autoconfig',

  async ({ effects }) => ({
    name: 'Auto-Configure',
    description:
      'Automatically configure flowee.conf for the needs of another service',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'hidden',
  }),

  async ({ effects, prefill }) => {
    if (!prefill) return fullConfigSpec

    return fullConfigSpec
      .filterFromPartial(prefill as typeof fullConfigSpec._PARTIAL)
      .disableFromPartial(
        prefill as typeof fullConfigSpec._PARTIAL,
        'These fields were provided by a task and cannot be edited',
      )
  },

  async ({ effects }) => {
    const conf = await floweeConfFile.read().once()
    const store = await storeJson.read().once()
    return {
      ...conf,
      torEnabled: store?.torEnabled ?? true,
      torIsolation: store?.torIsolation ?? true,
    }
  },

  async ({ effects, input }) => {
    const { torEnabled, torIsolation, ...confInput } = input as any
    await floweeConfFile.merge(effects, confInput)
    await storeJson.merge(effects, {
      torEnabled: torEnabled ?? true,
      torIsolation: torIsolation ?? true,
    })
  },
)
