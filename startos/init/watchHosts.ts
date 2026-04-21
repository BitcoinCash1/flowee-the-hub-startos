import { floweeConfFile } from '../fileModels/flowee.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { peerInterfaceId } from '../utils'

// Format a HostnameInfo as "host:port" (or "[v6]:port"), stripping any scheme
// since externalip takes a bare address.
const toHostPort = (h: { hostname: string; port: number | null }): string => {
  const host = h.hostname.includes(':') ? `[${h.hostname}]` : h.hostname
  return h.port != null ? `${host}:${h.port}` : host
}

export const watchHosts = sdk.setupOnInit(async (effects) => {
  const store = await storeJson.read().const(effects)
  const advertiseClearnetInbound = !!store?.advertiseClearnetInbound

  const conf = await floweeConfFile.read().const(effects)
  const onlynetList: string[] = ((conf?.onlynet as string[] | undefined) ?? []).filter(Boolean)
  const onlynetActive = onlynetList.length > 0
  const allowIpv4 = !onlynetActive || onlynetList.includes('ipv4')
  const allowIpv6 = !onlynetActive || onlynetList.includes('ipv6')

  const publicInfo = await sdk.serviceInterface
    .getOwn(effects, peerInterfaceId, (i) =>
      i?.addressInfo?.public.filter({
        exclude: { kind: 'domain' },
      }),
    )
    .const()

  if (!publicInfo) return

  const externalip: string[] = []

  const onions = publicInfo
    .filter({
      predicate: ({ metadata }) =>
        metadata.kind === 'plugin' && metadata.packageId === 'tor',
    })
    .format('hostname-info')
    .map(toHostPort)

  externalip.push(...onions)

  if (advertiseClearnetInbound) {
    if (allowIpv4) {
      const ipv4s = publicInfo
        .filter({ kind: 'ipv4' })
        .format('hostname-info')
        .map(toHostPort)
      externalip.push(...ipv4s)
    }
    if (allowIpv6) {
      const ipv6s = publicInfo
        .filter({ kind: 'ipv6' })
        .format('hostname-info')
        .map(toHostPort)
      externalip.push(...ipv6s)
    }
  }

  await floweeConfFile.merge(
    effects,
    {
      externalip: externalip.length > 0 ? externalip : [],
    },
    { allowWriteAfterConst: true },
  )
})
