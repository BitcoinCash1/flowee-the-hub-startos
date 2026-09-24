import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const reindex = sdk.Action.withoutInput(
  'reindex',

  async () => ({
    name: i18n('Reindex Blockchain'),
    description: i18n(
      'Rebuild the UTXO database by re-verifying every block already on disk. Use this if the node reports a corrupt database.',
    ),
    warning: i18n(
      'This re-verifies the whole chain and can take many hours. Flowee restarts immediately.',
    ),
    allowedStatuses: 'any',
    group: i18n('Maintenance'),
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    await storeJson.merge(effects, { reindex: true, fullySynced: false })
    await effects.restart()
    return null
  },
)
