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
  username: Value.text({
    name: 'Username',
    description: 'RPC username used by services connecting to Flowee.',
    required: true,
    default: 'flowee',
    masked: false,
    placeholder: 'flowee',
  }),
})

export const generateCredential = sdk.Action.withInput(
  'generate-rpc-credential',
  async () => ({
    name: 'Generate RPC Credential',
    description:
      'Generate a new default RPC username/password pair and apply it to flowee.conf.',
    warning:
      'Any dependent service using old credentials must be reconfigured after this change.',
    allowedStatuses: 'any',
    group: 'Credentials',
    visibility: 'enabled',
  }),
  spec,
  async ({ effects }) => {
    const store = await storeJson.read().once()
    return { username: store?.rpcUser ?? 'flowee' }
  },
  async ({ effects, input }) => {
    const username = String(input.username || 'flowee').trim() || 'flowee'
    const password = generatePassword(32)

    await storeJson.merge(effects, {
      rpcUser: username,
      rpcPassword: password,
    })

    await floweeConfFile.merge(effects, {
      raw: {
        rpcuser: username,
        rpcpassword: password,
      },
    })

    return {
      version: '1' as const,
      title: 'RPC Credential Updated',
      message: [
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
