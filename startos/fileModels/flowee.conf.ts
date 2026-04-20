import { FileHelper, T, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Flowee uses INI-style config (flowee.conf) similar to bitcoin.conf
const iniString = z
  .union([z.array(z.string()).transform((a) => a.at(-1)!), z.string()])
  .optional()
  .catch(undefined)

const iniStringArray = z
  .union([z.array(z.string()), z.string().transform((s) => [s])])
  .optional()
  .catch(undefined)

const iniNumber = z
  .union([
    z.array(z.string()).transform((a) => Number(a.at(-1))),
    z.string().transform(Number),
    z.number(),
  ])
  .optional()
  .catch(undefined)

const iniBoolean = z
  .union([
    z.string().transform((s) => !!Number(s)),
    z.number().transform((n) => !!n),
    z.boolean(),
  ])
  .optional()
  .catch(undefined)

export const shape = z
  .object({
    // RPC
    server: z.literal(true).catch(true),
    rpcbind: iniString,
    rpcallowip: iniString,
    rpcport: iniNumber,
    // Connection
    listen: iniBoolean,
    maxconnections: iniNumber,
    addnode: iniStringArray,
    onlynet: iniStringArray,
    port: iniNumber,
    // Relay
    minrelaytxfee: iniNumber,
    maxmempool: iniNumber,
    mempoolexpiry: iniNumber,
    datacarrier: iniBoolean,
    datacarriersize: iniNumber,
    blocksizeacceptlimit: iniNumber,
    // Block creation
    blockmaxsize: iniNumber,
    // Flowee Binary API (apibind — binary protocol, much faster than JSON-RPC)
    apibind: iniString,
    api_max_addresses: iniNumber,
    api_connection_per_ip: iniNumber,
    // Tor / Proxy
    proxy: iniString,
    onion: iniString,
    listenonion: iniBoolean,
    proxyrandomize: iniBoolean,
    // Network buffers
    maxreceivebuffer: iniNumber,
    maxsendbuffer: iniNumber,
    // Bandwidth
    maxuploadtarget: iniNumber,
    // External IP
    externalip: iniStringArray,
    // Thin blocks
    'use-thinblocks': iniBoolean,
    'min-thin-peers': iniNumber,
    // General
    maxorphantx: iniNumber,
    checkblocks: iniNumber,
    rest: iniBoolean,
    rpcthreads: iniNumber,
  })
  .loose()

function stringifyPrimitives(a: unknown): unknown {
  if (a && typeof a === 'object') {
    if (Array.isArray(a)) return a.map(stringifyPrimitives)
    return Object.fromEntries(
      Object.entries(a as Record<string, unknown>).map(([k, v]) => [
        k,
        stringifyPrimitives(v),
      ]),
    )
  } else if (typeof a === 'boolean') {
    return a ? 1 : 0
  }
  return a
}

const { InputSpec, Value, List } = sdk

const ONLYNET_VALUES = { ipv4: 'IPv4', ipv6: 'IPv6', onion: 'Tor (.onion)' } as const
type OnlynetKey = keyof typeof ONLYNET_VALUES
const ALL_ONLYNETS = Object.keys(ONLYNET_VALUES) as OnlynetKey[]

export const fullConfigSpec = InputSpec.of({
  raw: Value.hidden(shape),

  // ── Node Settings ──────────────────────────────────────────────────────────
  rest: Value.toggle({
    name: 'REST API',
    description: 'Accept public REST requests. Provides HTTP-based access to blockchain data.',
    default: true,
  }),

  // ── Tor / Privacy ──────────────────────────────────────────────────────────
  torEnabled: Value.toggle({
    name: 'Tor Routing',
    description:
      'Route all outbound peer connections through the Tor network for enhanced privacy. ' +
      'Requires the Tor package to be installed and running.',
    default: true,
  }),
  torIsolation: Value.toggle({
    name: 'Tor Stream Isolation',
    description:
      'Use a separate Tor circuit for each peer connection (proxyrandomize). ' +
      'Provides stronger privacy at the cost of slightly slower connection establishment.',
    default: true,
  }),

  // ── Connection ─────────────────────────────────────────────────────────────
  onlynet: Value.multiselect({
    name: 'Allowed Networks',
    description:
      'Restrict peer connections to specific network types. ' +
      'All checked = allow all (default). Uncheck to exclude a network.',
    default: ALL_ONLYNETS,
    values: ONLYNET_VALUES,
  }),
  onionOnly: Value.toggle({
    name: 'Onion-Only Mode',
    description:
      'Force peer connections to Tor only (equivalent to onlynet=onion). Disabled by default so Tor and clearnet can coexist.',
    default: false,
  }),
  maxconnections: Value.number({
    name: 'Maximum Connections',
    description: 'Maximum number of peer connections.',
    default: 125,
    required: false,
    min: 8,
    max: 1000,
    integer: true,
    placeholder: '125',
  }),
  addnode: Value.list(
    List.text(
      {
        name: 'Add Peers',
        description:
          'Manually add specific peers by address (ip:port). The node will always maintain connections to these peers.',
        default: [],
        minLength: null,
        maxLength: null,
      },
      {
        masked: false,
        placeholder: '192.168.1.10:8333',
      },
    ),
  ),
  maxuploadtarget: Value.number({
    name: 'Max Upload Target',
    description: 'Limit total outbound bandwidth per 24 hours. 0 = unlimited.',
    required: false,
    default: null,
    min: 0,
    max: null,
    integer: true,
    units: 'MB/day',
    placeholder: '0 (unlimited)',
  }),
  maxreceivebuffer: Value.number({
    name: 'Max Receive Buffer',
    description: 'Maximum per-connection receive buffer in KB (n × 1000 bytes). Larger values allow more data in-flight per peer.',
    required: false,
    default: null,
    min: 1,
    max: 65536,
    integer: true,
    units: 'KB',
    placeholder: '5000',
  }),
  maxsendbuffer: Value.number({
    name: 'Max Send Buffer',
    description: 'Maximum per-connection send buffer in KB (n × 1000 bytes).',
    required: false,
    default: null,
    min: 1,
    max: 65536,
    integer: true,
    units: 'KB',
    placeholder: '1000',
  }),
  externalip: Value.list(
    List.text(
      {
        name: 'External IP / Onion',
        description:
          'Manually specify your public IP address or .onion address for incoming connections. ' +
          'Useful if auto-detection fails or you have a static IP.',
        default: [],
        minLength: null,
        maxLength: null,
      },
      {
        masked: false,
        placeholder: '203.0.113.1 or yournode.onion',
      },
    ),
  ),

  // ── Relay ──────────────────────────────────────────────────────────────────
  maxmempool: Value.number({
    name: 'Max Mempool Size',
    description: 'Maximum mempool memory usage in megabytes.',
    required: false,
    default: null,
    min: 5,
    max: null,
    integer: true,
    units: 'MB',
    placeholder: '300',
  }),
  minrelaytxfee: Value.number({
    name: 'Minimum Relay Fee',
    description: 'Minimum fee rate (BCH/kB) for relaying transactions.',
    required: false,
    default: null,
    min: 0,
    max: null,
    integer: false,
    units: 'BCH/kB',
    placeholder: '0.00001',
    step: 0.000001,
  }),
  mempoolexpiry: Value.number({
    name: 'Mempool Expiry',
    description: 'Hours before unconfirmed transactions are evicted.',
    required: false,
    default: null,
    min: 1,
    max: 720,
    integer: true,
    units: 'hours',
    placeholder: '72',
  }),

  // ── Block Policy ──────────────────────────────────────────────────────────
  blocksizeacceptlimit: Value.number({
    name: 'Block Size Accept Limit',
    description: 'Maximum accepted block size in MB. The Hub will reject blocks larger than this.',
    required: false,
    default: null,
    min: 1,
    max: 256,
    integer: false,
    units: 'MB',
    placeholder: '32.0',
  }),

  // ── RPC ───────────────────────────────────────────────────────────────────
  rpcthreads: Value.number({
    name: 'RPC Threads',
    description: 'Number of threads for RPC calls.',
    required: false,
    default: 4,
    min: 1,
    max: 64,
    integer: true,
    units: 'threads',
    placeholder: '4',
  }),

  // xthin is intentionally always enabled and hidden from UI.
  'use-thinblocks': Value.hidden(z.boolean().catch(true)),
  'min-thin-peers': Value.hidden(z.number().int().catch(2)),
})

function fileToForm(
  input: z.infer<typeof shape>,
): T.DeepPartial<typeof fullConfigSpec._TYPE> {
  const {
    rest, maxconnections, addnode, onlynet,
    maxmempool, minrelaytxfee, mempoolexpiry,
    blocksizeacceptlimit, rpcthreads,
    maxreceivebuffer, maxsendbuffer, maxuploadtarget, externalip,
  } = input

  // When no onlynet is written in conf, all networks are allowed — show all checked
  const onlynetFromConf = onlynet?.filter((v): v is string => !!v) ?? []
  const onlynetForm = onlynetFromConf.length === 0 ? [...ALL_ONLYNETS] : onlynetFromConf as OnlynetKey[]
  const onionOnly = onlynetFromConf.length > 0 && onlynetFromConf.every((n) => n === 'onion')

  return {
    raw: input ?? {},
    rest,
    maxconnections,
    onlynet: onlynetForm,
    onionOnly,
    addnode: addnode?.filter((v): v is string => !!v) ?? [],
    maxuploadtarget,
    maxreceivebuffer,
    maxsendbuffer,
    externalip: externalip?.filter((v): v is string => !!v) ?? [],
    maxmempool,
    minrelaytxfee,
    mempoolexpiry,
    blocksizeacceptlimit,
    rpcthreads,
    'use-thinblocks': true,
    'min-thin-peers': 2,
    // torEnabled / torIsolation come from store.json, overlaid by the action handler
  }
}

function formToFile(
  input: T.DeepPartial<typeof fullConfigSpec._TYPE>,
): z.infer<typeof shape> {
  const {
    raw, rest, maxconnections, onlynet, onionOnly, addnode,
    maxmempool, minrelaytxfee, mempoolexpiry,
    blocksizeacceptlimit, rpcthreads,
    maxreceivebuffer, maxsendbuffer, maxuploadtarget, externalip,
  } = input

  // If all networks selected (or none specified), don't write onlynet (means allow all)
  const onlynetList = (onlynet as string[] | undefined)?.filter(Boolean) ?? []
  const allSelected = ALL_ONLYNETS.every((n) => onlynetList.includes(n))
  const writeOnlynet = onionOnly
    ? ['onion']
    : (onlynetList.length > 0 && !allSelected ? onlynetList : undefined)

  const externalipList = (externalip as string[] | undefined)?.filter(Boolean) ?? []

  return {
    ...raw,
    server: true,
    listen: true,
    rpcbind: '0.0.0.0',
    rpcallowip: '0.0.0.0/0',
    rpcport: 8332,
    port: 8333,
    rest: rest ?? false,
    maxconnections: maxconnections ?? undefined,
    onlynet: writeOnlynet,
    addnode: addnode && (addnode as string[]).length > 0 ? (addnode as string[]).filter(Boolean) : undefined,
    maxuploadtarget: maxuploadtarget ?? undefined,
    maxreceivebuffer: maxreceivebuffer ?? undefined,
    maxsendbuffer: maxsendbuffer ?? undefined,
    externalip: externalipList.length > 0 ? externalipList : undefined,
    maxmempool: maxmempool ?? undefined,
    minrelaytxfee: minrelaytxfee ?? undefined,
    mempoolexpiry: mempoolexpiry ?? undefined,
    blocksizeacceptlimit: blocksizeacceptlimit ?? undefined,
    rpcthreads: rpcthreads ?? undefined,
    'use-thinblocks': true,
    'min-thin-peers': 2,
    // proxy / onion / listenonion / proxyrandomize are set as daemon args in main.ts
    // torEnabled / torIsolation live in store.json, not in flowee.conf
  }
}

export const floweeConfFile = FileHelper.ini(
  { base: sdk.volumes.main, subpath: '/flowee.conf' },
  fullConfigSpec.partialValidator,
  { bracketedArray: false },
  {
    onRead: (a) => fileToForm(shape.parse(a)),
    onWrite: (a) => stringifyPrimitives(formToFile(a)) as Record<string, unknown>,
  },
)
