import { floweeConfFile } from '../../fileModels/flowee.conf'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { getRpcAuth, getRpcUsers } from './rpcauth'

const { InputSpec, Value } = sdk

export const deleteRpcCredentials = sdk.Action.withInput(
  'delete-rpc-credentials',

  async ({ effects }) => ({
    name: i18n('Delete RPC Credentials'),
    description: i18n(
      'Revoke credentials so they can no longer reach the JSON-RPC interface.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Credentials'),
    visibility: (await getRpcUsers(effects)).length
      ? 'enabled'
      : { disabled: i18n('There are no RPC credentials') },
  }),

  InputSpec.of({
    usernames: Value.dynamicMultiselect(async ({ effects }) => ({
      name: i18n('Credentials'),
      default: [],
      values: Object.fromEntries(
        (await getRpcUsers(effects)).map((u) => [u, u]),
      ),
    })),
  }),

  async () => {},

  async ({ effects, input }) => {
    if (!input.usernames.length) {
      return {
        version: '1',
        title: i18n('Nothing Selected'),
        message: i18n('No credentials were deleted.'),
        result: null,
      }
    }

    const rpcauth = (await getRpcAuth(effects)).filter(
      (entry) => !input.usernames.includes(entry.split(':', 2)[0]),
    )
    await floweeConfFile.merge(effects, {
      raw: { rpcauth: rpcauth.length ? rpcauth : undefined },
    })

    return {
      version: '1',
      title: i18n('Credentials Deleted'),
      message: i18n(
        'Restart Flowee to stop accepting the deleted credentials.',
      ),
      result: null,
    }
  },
)
