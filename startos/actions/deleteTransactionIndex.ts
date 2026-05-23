import { sdk } from '../sdk'
import { mainMounts } from '../mounts'
import { rootDir } from '../utils'

export const deleteTransactionIndex = sdk.Action.withoutInput(
  'delete-transaction-index',
  async ({ effects: _effects }) => ({
    name: 'Delete Transaction Index',
    description:
      'Delete the transaction index database. It will be rebuilt automatically when the service starts.',
    warning:
      'Address lookups and transaction queries will be unavailable until the index is fully rebuilt. This can take several hours.',
    allowedStatuses: 'only-stopped' as const,
    group: 'Maintenance',
    visibility: 'enabled' as const,
  }),
  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'flowee' },
      mainMounts,
      'delete-tx-index',
      async (sub) => {
        await sub.exec(['rm', '-rf', `${rootDir}/indexer`])
      },
    )
    return {
      version: '1' as const,
      title: 'Transaction Index Deleted',
      message: 'The transaction index has been removed. It will be rebuilt automatically on the next startup.',
      result: null,
    }
  },
)
