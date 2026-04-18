import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { rpcPort } from '../utils'

const { InputSpec, Value } = sdk

export const viewRpcCredentials = sdk.Action.withInput(
  'view-rpc-credentials',
  async ({ effects }) => ({
    name: 'View RPC Credentials',
    description:
      'View stored RPC credentials by name. Select a credential to see its username, password, and port.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Credentials',
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const store = await storeJson.read().once()
    const creds = store?.rpcCredentials ?? []

    if (creds.length === 0) {
      return InputSpec.of({
        name: Value.select({
          name: 'Credential',
          description: 'No credentials found. Generate one first.',
          values: { '': '(none)' },
          default: '',
        }),
      })
    }

    const values: Record<string, string> = {}
    for (const c of creds) values[c.name] = c.name

    return InputSpec.of({
      name: Value.select({
        name: 'Credential',
        description: 'Select a stored credential to view its details.',
        values,
        default: creds[0]!.name,
      }),
    })
  },

  async ({ effects }) => {
    const store = await storeJson.read().once()
    const creds = store?.rpcCredentials ?? []
    return { name: creds[0]?.name ?? '' }
  },

  async ({ effects, input }) => {
    const store = await storeJson.read().once()
    const creds = store?.rpcCredentials ?? []
    const selected = creds.find((c) => c.name === input.name)

    if (!selected) {
      return {
        version: '1' as const,
        title: 'Credential Not Found',
        message: 'The selected credential was not found.',
        result: null,
      }
    }

    const isDefault = creds[0]?.name === selected.name

    return {
      version: '1' as const,
      title: `RPC Credential: ${selected.name}`,
      message: [
        `**Name:** ${selected.name}${isDefault ? ' (active)' : ''}`,
        `**Username:** ${selected.username}`,
        `**Password:** ${selected.password}`,
        `**Port:** ${rpcPort}`,
      ].join('\n'),
      result: {
        type: 'single' as const,
        value: `${selected.username}:${selected.password}`,
        copyable: true,
        qr: false,
        masked: true,
      },
    }
  },
)
