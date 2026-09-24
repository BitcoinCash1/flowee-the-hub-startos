import { floweeConfFile } from '../../fileModels/flowee.conf'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { getRpcAuth, getRpcUsers, rpcAuthEntry } from './rpcauth'

const { InputSpec, Value } = sdk

/**
 * Registers a credential a dependent service already holds. Flowee stores only
 * the hash, so the caller has to bring both halves — it cannot read a password
 * back out later.
 */
export const createDependentCredential = sdk.Action.withInput(
  'create-dependent-credential',

  async () => ({
    name: i18n('Create RPC Credential For A Dependent'),
    description: i18n(
      'Register the username and password a dependent service will use to reach the JSON-RPC interface.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'hidden',
  }),

  InputSpec.of({
    username: Value.dynamicText(async () => ({
      name: i18n('Username'),
      description: i18n('The name this credential logs in as.'),
      disabled: i18n('Provided by the dependent service'),
      required: true,
      default: null,
      patterns: [
        {
          regex: '^[a-zA-Z0-9_]+$',
          description: i18n('Letters, numbers and underscores only.'),
        },
      ],
    })),
    password: Value.dynamicText(async () => ({
      name: i18n('Password'),
      description: i18n('The password this credential logs in with.'),
      disabled: i18n('Provided by the dependent service'),
      required: true,
      default: null,
      masked: true,
    })),
  }),

  async () => {},

  async ({ effects, input }) => {
    const { username, password } = input

    if ((await getRpcUsers(effects)).includes(username)) {
      return {
        version: '1',
        title: i18n('Username Already Taken'),
        message: i18n('A credential for ${username} already exists.', {
          username,
        }),
        result: null,
      }
    }

    await floweeConfFile.merge(effects, {
      raw: {
        rpcauth: [
          ...(await getRpcAuth(effects)),
          rpcAuthEntry(username, password),
        ],
      },
    })

    return {
      version: '1',
      title: i18n('Credential Created'),
      message: i18n('Restart Flowee for the new credential to take effect.'),
      result: null,
    }
  },
)
