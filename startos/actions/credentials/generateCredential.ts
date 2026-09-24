import { floweeConfFile } from '../../fileModels/flowee.conf'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import {
  generatePassword,
  getRpcAuth,
  getRpcUsers,
  rpcAuthEntry,
} from './rpcauth'

const { InputSpec, Value } = sdk

export const generateRpcCredential = sdk.Action.withInput(
  'generate-rpc-credential',

  async () => ({
    name: i18n('Generate RPC Credential'),
    description: i18n(
      'Create a username and password an external wallet or explorer can use to reach the JSON-RPC interface. The password is shown once and never stored, so save it before closing the result.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Credentials'),
    visibility: 'enabled',
  }),

  InputSpec.of({
    username: Value.text({
      name: i18n('Username'),
      description: i18n('The name this credential logs in as.'),
      required: true,
      default: null,
      patterns: [
        {
          regex: '^[a-zA-Z0-9_]+$',
          description: i18n('Letters, numbers and underscores only.'),
        },
      ],
    }),
  }),

  async () => {},

  async ({ effects, input }) => {
    if ((await getRpcUsers(effects)).includes(input.username)) {
      return {
        version: '1',
        title: i18n('Username Already Taken'),
        message: i18n('A credential for ${username} already exists.', {
          username: input.username,
        }),
        result: null,
      }
    }

    const password = generatePassword()
    await floweeConfFile.merge(effects, {
      raw: {
        rpcauth: [
          ...(await getRpcAuth(effects)),
          rpcAuthEntry(input.username, password),
        ],
      },
    })

    return {
      version: '1',
      title: i18n('Credential Created'),
      message: i18n(
        'Save this password now — only a hash of it is kept, so it cannot be shown again. Restart Flowee for the new credential to take effect.',
      ),
      result: {
        type: 'single',
        value: `${input.username}:${password}`,
        copyable: true,
        qr: false,
        masked: true,
      },
    }
  },
)
