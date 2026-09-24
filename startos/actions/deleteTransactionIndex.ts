import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { mainMounts, rootDir } from '../utils'

export const deleteTransactionIndex = sdk.Action.withoutInput(
  'delete-transaction-index',

  async () => ({
    name: i18n('Delete Transaction Index'),
    description: i18n(
      'Discard the transaction index. Flowee rebuilds it from the block files the next time it starts.',
    ),
    warning: i18n(
      'Transaction lookups stay unavailable until the rebuild finishes, which can take several hours.',
    ),
    allowedStatuses: 'only-stopped',
    group: i18n('Maintenance'),
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'flowee' },
      mainMounts,
      'delete-transaction-index',
      // Every network keeps its own index beside its chain data.
      (sub) =>
        sub.exec([
          'sh',
          '-c',
          `rm -rf ${rootDir}/txindex ${rootDir}/*/txindex`,
        ]),
    )

    return {
      version: '1',
      title: i18n('Transaction Index Deleted'),
      message: i18n('Flowee will rebuild the index when it next starts.'),
      result: null,
    }
  },
)
