import { T, utils } from '@start9labs/start-sdk'
import { createHmac, randomBytes } from 'crypto'
import { floweeConfFile } from '../../fileModels/flowee.conf'

/**
 * An `rpcauth` entry is `<user>:<salt>$<hex HMAC-SHA256 of the password, keyed
 * by the salt>` — the same shape Bitcoin Core's `rpcauth.py` emits, and what
 * the Hub compares an incoming Basic-Auth header against.
 */
export const rpcAuthEntry = (username: string, password: string): string => {
  const salt = randomBytes(16).toString('hex')
  const hash = createHmac('sha256', salt).update(password).digest('hex')
  return `${username}:${salt}$${hash}`
}

export const generatePassword = () =>
  utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 32 })

export const getRpcAuth = async (effects: T.Effects) =>
  (await floweeConfFile.read((c) => c.raw?.rpcauth).const(effects))?.filter(
    (e): e is string => !!e,
  ) ?? []

export const getRpcUsers = async (effects: T.Effects) =>
  (await getRpcAuth(effects)).map((e) => e.split(':', 2)[0])
