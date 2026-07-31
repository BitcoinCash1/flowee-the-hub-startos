import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

const { InputSpec, Value } = sdk

export const networkConfig = sdk.Action.withInput(
  'network-config',

  async () => ({
    name: i18n('Network'),
    description: i18n(
      'Choose which Bitcoin Cash network the node joins. Each network keeps its own chain data and its own RPC and peer ports.',
    ),
    warning: i18n(
      'Flowee restarts and begins syncing the chosen network from the beginning. Data for the network you are leaving is kept.',
    ),
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  InputSpec.of({
    network: Value.select({
      name: i18n('Network'),
      description: i18n('The network to join.'),
      values: {
        mainnet: i18n('Mainnet'),
        testnet: i18n('Testnet3'),
        testnet4: i18n('Testnet4'),
        scalenet: i18n('Scalenet'),
        chipnet: i18n('Chipnet'),
        regtest: i18n('Regtest'),
      },
      default: 'mainnet',
    }),
  }),

  async () => ({
    network: (await storeJson.read((s) => s.network).once()) ?? undefined,
  }),

  async ({ effects, input }) => {
    const current = await storeJson.read((s) => s.network).once()
    if (current === input.network) {
      return {
        version: '1',
        title: i18n('Network Unchanged'),
        message: i18n('Flowee is already on this network.'),
        result: null,
      }
    }

    // main watches the network, so the merge is what restarts the node.
    await storeJson.merge(effects, {
      network: input.network,
      fullySynced: false,
    })

    return {
      version: '1',
      title: i18n('Network Changed'),
      message: i18n('Flowee is restarting to join the new network.'),
      result: null,
    }
  },
)
