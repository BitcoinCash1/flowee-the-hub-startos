import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { mainMounts, networkSubdir, rootDir } from '../utils'

const { InputSpec, Value } = sdk

const TEST_NETWORKS = {
  testnet: i18n('Testnet3'),
  testnet4: i18n('Testnet4'),
  scalenet: i18n('Scalenet'),
  chipnet: i18n('Chipnet'),
  regtest: i18n('Regtest'),
} as const

export const deleteTestNetworkData = sdk.Action.withInput(
  'delete-test-network-data',

  async () => ({
    name: i18n('Delete Test Network Data'),
    description: i18n(
      'Reclaim the disk a test network is using. Mainnet data is never touched.',
    ),
    warning: i18n('The chain data for the networks you pick is deleted.'),
    allowedStatuses: 'only-stopped',
    group: i18n('Maintenance'),
    visibility: 'enabled',
  }),

  InputSpec.of({
    networks: Value.multiselect({
      name: i18n('Networks'),
      description: i18n('The test networks whose data should be deleted.'),
      default: [],
      values: TEST_NETWORKS,
    }),
  }),

  async () => ({ networks: [] }),

  async ({ effects, input }) => {
    if (!input.networks.length) {
      return {
        version: '1',
        title: i18n('Nothing Selected'),
        message: i18n('No data was deleted.'),
        result: null,
      }
    }

    const active = await storeJson.read((s) => s.network).once()
    if (input.networks.some((n) => n === active)) {
      return {
        version: '1',
        title: i18n('Cannot Delete The Active Network'),
        message: i18n(
          'Flowee is set to ${network}. Switch networks before deleting its data.',
          { network: active ?? '' },
        ),
        result: null,
      }
    }

    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'flowee' },
      mainMounts,
      'delete-test-network-data',
      (sub) =>
        sub.exec([
          'rm',
          '-rf',
          ...input.networks.map((n) => `${rootDir}/${networkSubdir[n]}`),
        ]),
    )

    return {
      version: '1',
      title: i18n('Test Network Data Deleted'),
      message: i18n('Mainnet data was not touched.'),
      result: null,
    }
  },
)
