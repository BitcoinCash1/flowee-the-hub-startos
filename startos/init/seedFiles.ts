import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { floweeConfFile } from '../fileModels/flowee.conf'

function generatePassword(length = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  const rpcPassword = generatePassword(32)

  await storeJson.merge(effects, {
    rpcCredentials: [
      {
        name: 'Default',
        username: 'flowee',
        password: rpcPassword,
      },
    ],
    rpcUser: 'flowee',
    rpcPassword,
    initialized: true,
    reindex: false,
    fullySynced: false,
  })

  await floweeConfFile.merge(effects, {
    raw: {
      rpcuser: 'flowee',
      rpcpassword: rpcPassword,
    },
    rest: false,
    maxconnections: 125,
    rpcthreads: 4,
  })
})
