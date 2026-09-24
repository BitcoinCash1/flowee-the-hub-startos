import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  GetBlockchainInfo,
  GetNetworkInfo,
  hubCliArgs,
  mainMounts,
} from '../utils'

export const runtimeInfo = sdk.Action.withoutInput(
  'runtime-info',

  async () => ({
    name: i18n('Node Info'),
    description: i18n(
      'Show the running node: version, chain, peer count and sync progress',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const cli = hubCliArgs(
      (await storeJson.read((s) => s.network).once()) ?? 'mainnet',
    )

    return sdk.SubContainer.withTemp(
      effects,
      { imageId: 'flowee' },
      mainMounts,
      'runtime-info',
      async (sub) => {
        const call = async <T>(method: string): Promise<T | null> => {
          const res = await sub.exec([...cli, method])
          if (res.exitCode !== 0) return null
          try {
            return JSON.parse(res.stdout.toString())
          } catch {
            return null
          }
        }

        const [net, chain] = await Promise.all([
          call<GetNetworkInfo>('getnetworkinfo'),
          call<GetBlockchainInfo>('getblockchaininfo'),
        ])

        const lines: string[] = []
        if (net) {
          lines.push(`${i18n('Version')}: ${net.subversion}`)
          lines.push(`${i18n('Peers')}: ${net.connections}`)
        }
        if (chain) {
          lines.push(`${i18n('Chain')}: ${chain.chain}`)
          lines.push(`${i18n('Blocks')}: ${chain.blocks} / ${chain.headers}`)
          lines.push(
            `${i18n('Sync')}: ${(chain.verificationprogress * 100).toFixed(2)}%`,
          )
        }

        return {
          version: '1',
          title: i18n('Node Info'),
          message: null,
          result: {
            type: 'single',
            value: lines.length
              ? lines.join('\n')
              : i18n('The node is not answering RPC calls yet.'),
            copyable: false,
            qr: false,
            masked: false,
          },
        }
      },
    )
  },
)
