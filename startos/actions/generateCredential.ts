import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { floweeConfFile } from '../fileModels/flowee.conf'
import { rpcPort } from '../utils'

const { InputSpec, Value } = sdk

function generatePassword(length = 32): string {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = new Uint8Array(length)

  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }

  let out = ''
  for (let i = 0; i < bytes.length; i++) out += chars[bytes[i] % chars.length]
  return out
}

const spec = InputSpec.of({
  name: Value.text({
    name: 'Credential Name',
    description:
      'A friendly label for this credential (e.g. "Fulcrum", "Explorer", "Wallet").',
    required: true,
    default: null,
    masked: false,
    placeholder: 'My Service',
  }),
  username: Value.text({
    name: 'Username',
    description: 'Alphanumeric username for RPC authentication.',
    required: true,
    default: null,
    masked: false,
    placeholder: 'myservice',
  }),
})

export const generateRpcCredential = sdk.Action.withInput(
  'generate-rpc-credential',
  async () => ({
    name: 'Generate RPC Credential',
    description:
      'Create a new named RPC credential. The generated password is stored and can be viewed later in "View RPC Credentials".',
    warning: null,
    allowedStatuses: 'any',
    group: 'Credentials',
    visibility: 'enabled',
  }),
  spec,
  async ({ effects }) => {
    return {
      name: undefined as string | undefined,
      username: undefined as string | undefined,
    }
  },
  async ({ effects, input }) => {
    const name = String(input.name || '').trim()
    const username = String(input.username || '').trim()
    const password = generatePassword(32)

    const store = await storeJson.read().once()
    const creds = [...(store?.rpcCredentials ?? [])]

    const filtered = creds.filter((c) => c.name !== name)
    filtered.push({ name, username, password })

    const active = filtered[0] ?? { name, username, password }

    await storeJson.merge(effects, {
      rpcCredentials: filtered,
      rpcUser: active.username,
      rpcPassword: active.password,
    })

    await floweeConfFile.merge(effects, {
      raw: {
        rpcuser: active.username,
        rpcpassword: active.password,
      },
    })

    return {
      version: '1' as const,
      title: `RPC Credential: ${name}`,
      message: [
        'Credential saved. You can view it anytime in **View RPC Credentials**.',
        '',
        `**Name:** ${name}`,
        `**Username:** ${username}`,
        `**Password:** ${password}`,
        `**Port:** ${rpcPort}`,
      ].join('\n'),
      result: {
        type: 'single' as const,
        value: `${username}:${password}`,
        copyable: true,
        qr: false,
        masked: true,
      },
    }
  },
)
