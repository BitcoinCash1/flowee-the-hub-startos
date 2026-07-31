import { floweeConfFile } from '../fileModels/flowee.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { peerHostId, peerInterfaceId } from '../utils'

export const watchHosts = sdk.setupOnInit(async (effects) => {
  const advertise = await storeJson
    .read((s) => s.advertiseClearnetInbound)
    .const(effects)

  // One subscription on the peer host, mapped down to the addresses peers could
  // dial, so this re-runs only when that list changes rather than on unrelated
  // host churn. Onion addresses are deliberately absent: the hub understands
  // only v2 onions and refuses to start if it is handed a v3 one.
  const externalip = await sdk.host
    .getOwn(effects, peerHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === peerInterfaceId)
      if (!iface) return undefined
      return iface.addressInfo.public.filter({ kind: 'ip' }).format()
    })
    .const()

  if (!externalip) return

  await floweeConfFile.merge(
    effects,
    {
      raw: {
        externalip: advertise && externalip.length > 0 ? externalip : undefined,
      },
    },
    { allowWriteAfterConst: true },
  )
})
