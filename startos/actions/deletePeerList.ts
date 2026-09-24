import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { mainMounts, rootDir } from '../utils'

export const deletePeerList = sdk.Action.withoutInput(
  'delete-peer-list',

  async () => ({
    name: i18n('Delete Peer List'),
    description: i18n(
      'Forget every peer address the node has learned. It rediscovers peers from DNS seeds on the next start.',
    ),
    warning: i18n('Finding peers again can take a few minutes.'),
    allowedStatuses: 'only-stopped',
    group: i18n('Maintenance'),
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'flowee' },
      mainMounts,
      'delete-peer-list',
      // Every network keeps its own copy, and the user is deleting the concept
      // rather than one network's list.
      (sub) =>
        sub.exec([
          'sh',
          '-c',
          `rm -f ${rootDir}/peers.dat ${rootDir}/*/peers.dat`,
        ]),
    )

    return {
      version: '1',
      title: i18n('Peer List Deleted'),
      message: i18n('Flowee will rediscover peers when it next starts.'),
      result: null,
    }
  },
)
