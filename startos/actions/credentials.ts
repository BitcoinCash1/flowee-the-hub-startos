import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { rpcPort } from '../utils'

const { InputSpec, Value } = sdk

export const viewCredentials = sdk.Action.withInput(
  'view-credentials',
  async ({ effects }) => ({
    name: 'View RPC Credentials',
    description: 'View the default RPC username, password, and port.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Credentials',
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    return InputSpec.of({
      name: Value.select({
        name: 'Credential',
        description: 'Select a credential to view its details.',
        values: { Default: 'Default' },
        default: 'Default',
      }),
    })
  },

  async ({ effects }) => ({ name: 'Default' as const }),

  async ({ effects, input }) => {
    const store = await storeJson.read().once()
    const user = store?.rpcUser ?? 'flowee'
    const pass = store?.rpcPassword ?? ''

    return {
      version: '1' as const,
      title: 'RPC Credential: Default',
      message: [
        '**Name:** Default (active)',
        `**Username:** ${user}`,
        `**Password:** ${pass}`,
        `**Port:** ${rpcPort}`,
      ].join('\n'),
      result: {
        type: 'single' as const,
        value: `${user}:${pass}`,
        copyable: true,
        qr: false,
        masked: true,
      },
    }
  },
)
