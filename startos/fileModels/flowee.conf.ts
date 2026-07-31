import { FileHelper, T, z } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { apiPort } from '../utils'

// INI coercion helpers: INI parsing returns strings, and duplicate keys produce
// arrays.

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
    // RPC. The hub falls back to cookie auth whenever rpcpassword is empty,
    // which is how the package's own hub-cli calls authenticate; user and
    // dependent credentials are hashed rpcauth entries.
    rpcuser: z.undefined().optional().catch(undefined),
    rpcpassword: z.undefined().optional().catch(undefined),
    rpcauth: iniStringArray,
    server: z.literal(true).catch(true),
    rpcbind: iniString,
    rpcallowip: iniString,
    rpcport: iniNumber,
    rpcthreads: iniNumber,
    rest: iniBoolean,
    // Connection
    listen: iniBoolean,
    maxconnections: iniNumber,
    addnode: iniStringArray,
    onlynet: iniStringArray,
    externalip: iniStringArray,
    port: iniNumber,
    maxreceivebuffer: iniNumber,
    maxsendbuffer: iniNumber,
    maxuploadtarget: iniNumber,
    // Relay
    minrelaytxfee: iniNumber,
    maxmempool: iniNumber,
    mempoolexpiry: iniNumber,
    maxorphantx: iniNumber,
    datacarrier: iniBoolean,
    datacarriersize: iniNumber,
    blocksizeacceptlimit: iniNumber,
    blockmaxsize: iniNumber,
    // Flowee's own binary API
    apibind: iniString,
    api_max_addresses: iniNumber,
    api_connection_per_ip: iniNumber,
    // Thin blocks
    'use-thinblocks': iniBoolean,
    'min-thin-peers': iniNumber,
    // Keys the package must never leave in the file: the Tor arguments are
    // passed on the command line, and apilisten is the name apibind had before
    // upstream renamed it. Declaring them undefined is what removes them —
    // whatever is on disk parses to undefined and the next write omits it.
    proxy: z.undefined().optional().catch(undefined),
    onion: z.undefined().optional().catch(undefined),
    listenonion: z.undefined().optional().catch(undefined),
    proxyrandomize: z.undefined().optional().catch(undefined),
    apilisten: z.undefined().optional().catch(undefined),
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

/**
 * `onion` is deliberately absent: the hub only understands v2 onion addresses,
 * which the Tor network removed in 2021, so restricting peers to it would
 * leave the node with nothing to connect to. See README § Limitations.
 */
const ONLYNET_VALUES = { ipv4: 'IPv4', ipv6: 'IPv6' } as const
type OnlynetKey = keyof typeof ONLYNET_VALUES
const ALL_ONLYNETS = Object.keys(ONLYNET_VALUES) as OnlynetKey[]

export const fullConfigSpec = InputSpec.of({
  raw: Value.hidden(shape),

  // ── Node ───────────────────────────────────────────────────────────────────
  rest: Value.toggle({
    name: i18n('REST API'),
    description: i18n(
      'Serve the read-only HTTP REST API alongside JSON-RPC. It has no authentication, so anyone who can reach the RPC interface can read blockchain data.',
    ),
    default: false,
  }),
  blocksizeacceptlimit: Value.number({
    name: i18n('Block Size Accept Limit'),
    description: i18n(
      'Largest block the node will accept. Blocks above this size are rejected.',
    ),
    required: false,
    default: null,
    min: 1,
    max: 256,
    integer: false,
    units: 'MB',
    placeholder: '32.0',
  }),

  // ── Privacy ────────────────────────────────────────────────────────────────
  torProxyAll: Value.toggle({
    name: i18n('Route Peer Traffic Through Tor'),
    description: i18n(
      "Send every outbound peer connection through Tor's SOCKS proxy, so peers see Tor exit nodes instead of your IP address. Requires the Tor service, and slows down the initial sync considerably.",
    ),
    default: false,
  }),
  torIsolation: Value.toggle({
    name: i18n('Tor Stream Isolation'),
    description: i18n(
      'Give each peer connection its own Tor circuit, so peers cannot correlate your connections with one another.',
    ),
    default: true,
  }),
  advertiseClearnetInbound: Value.toggle({
    name: i18n('Advertise Public Address'),
    description: i18n(
      'Tell peers the public IPv4 and IPv6 addresses StartOS has assigned to the peer interface, so they can connect back to you. Addresses on a network you have excluded below are never advertised.',
    ),
    default: false,
  }),

  // ── Connection ─────────────────────────────────────────────────────────────
  onlynet: Value.multiselect({
    name: i18n('Allowed Networks'),
    description: i18n(
      'Networks the node may connect out over. Leave both selected to allow either.',
    ),
    default: ALL_ONLYNETS,
    values: ONLYNET_VALUES,
  }),
  maxconnections: Value.number({
    name: i18n('Maximum Connections'),
    description: i18n('Upper bound on simultaneous peer connections.'),
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
        name: i18n('Add Peers'),
        description: i18n(
          'Peers to always stay connected to, as address or address:port.',
        ),
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
    name: i18n('Max Upload Target'),
    description: i18n('Cap on outbound traffic per 24 hours. 0 is unlimited.'),
    required: false,
    default: null,
    min: 0,
    max: null,
    integer: true,
    units: 'MB/day',
    placeholder: '0 (unlimited)',
  }),
  maxreceivebuffer: Value.number({
    name: i18n('Max Receive Buffer'),
    description: i18n(
      'Per-connection receive buffer. Larger values let more data be in flight per peer.',
    ),
    required: false,
    default: null,
    min: 1,
    max: 65536,
    integer: true,
    units: 'KB',
    placeholder: '5000',
  }),
  maxsendbuffer: Value.number({
    name: i18n('Max Send Buffer'),
    description: i18n('Per-connection send buffer.'),
    required: false,
    default: null,
    min: 1,
    max: 65536,
    integer: true,
    units: 'KB',
    placeholder: '1000',
  }),

  // ── Relay ──────────────────────────────────────────────────────────────────
  maxmempool: Value.number({
    name: i18n('Max Mempool Size'),
    description: i18n('Memory the mempool may use before it evicts entries.'),
    required: false,
    default: null,
    min: 5,
    max: null,
    integer: true,
    units: 'MB',
    placeholder: '300',
  }),
  minrelaytxfee: Value.number({
    name: i18n('Minimum Relay Fee'),
    description: i18n('Fee rate below which transactions are not relayed.'),
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
    name: i18n('Mempool Expiry'),
    description: i18n(
      'How long an unconfirmed transaction stays in the mempool.',
    ),
    required: false,
    default: null,
    min: 1,
    max: 720,
    integer: true,
    units: 'hours',
    placeholder: '72',
  }),
  maxorphantx: Value.number({
    name: i18n('Max Orphan Transactions'),
    description: i18n(
      'How many transactions whose parents are still missing to hold in memory.',
    ),
    required: false,
    default: null,
    min: 0,
    max: null,
    integer: true,
    units: 'transactions',
    placeholder: '5000',
  }),

  // ── RPC ────────────────────────────────────────────────────────────────────
  rpcthreads: Value.number({
    name: i18n('RPC Threads'),
    description: i18n('Threads available to serve JSON-RPC requests.'),
    required: false,
    default: 4,
    min: 1,
    max: 64,
    integer: true,
    units: 'threads',
    placeholder: '4',
  }),

  // Thin blocks are Flowee's headline feature; the package always enables them.
  'use-thinblocks': Value.hidden(z.boolean().catch(true)),
  'min-thin-peers': Value.hidden(z.number().int().catch(2)),
})

function fileToForm(
  input: z.infer<typeof shape>,
): T.DeepPartial<typeof fullConfigSpec._TYPE> {
  const {
    rest,
    maxconnections,
    addnode,
    onlynet,
    maxmempool,
    minrelaytxfee,
    mempoolexpiry,
    maxorphantx,
    blocksizeacceptlimit,
    rpcthreads,
    maxreceivebuffer,
    maxsendbuffer,
    maxuploadtarget,
  } = input

  // An absent onlynet means "all networks", which the form shows as all boxes
  // checked. A value the form no longer offers (a hand-written onlynet=onion)
  // drops out rather than appearing as a phantom selection.
  const fromConf = (onlynet ?? []).filter((n): n is OnlynetKey =>
    ALL_ONLYNETS.includes(n as OnlynetKey),
  )

  return {
    raw: input,
    rest,
    maxconnections,
    onlynet: fromConf.length === 0 ? [...ALL_ONLYNETS] : fromConf,
    addnode: addnode?.filter((v): v is string => !!v) ?? [],
    maxuploadtarget,
    maxreceivebuffer,
    maxsendbuffer,
    maxmempool,
    minrelaytxfee,
    mempoolexpiry,
    maxorphantx,
    blocksizeacceptlimit,
    rpcthreads,
    'use-thinblocks': true,
    'min-thin-peers': 2,
    // torProxyAll / torIsolation / advertiseClearnetInbound live in store.json;
    // the actions that show them overlay their values onto this form.
  }
}

function formToFile(
  input: T.DeepPartial<typeof fullConfigSpec._TYPE>,
): z.infer<typeof shape> {
  const {
    raw,
    rest,
    maxconnections,
    onlynet,
    addnode,
    maxmempool,
    minrelaytxfee,
    mempoolexpiry,
    maxorphantx,
    blocksizeacceptlimit,
    rpcthreads,
    maxreceivebuffer,
    maxsendbuffer,
    maxuploadtarget,
  } = input

  const onlynetList = (onlynet ?? []).filter((n): n is OnlynetKey => !!n)
  const addnodeList = (addnode ?? []).filter((n): n is string => !!n)

  return {
    ...raw,
    rpcuser: undefined,
    rpcpassword: undefined,
    // Both are owned elsewhere — rpcauth by the credential actions, externalip
    // by watchHosts — and only pass through here, but a partial `raw` types
    // their entries as possibly absent. An onion address is dropped on the way
    // through: the Hub's parser predates v3, and one in externalip fails
    // validation and aborts startup.
    rpcauth: raw?.rpcauth?.filter((a): a is string => !!a),
    externalip: raw?.externalip?.filter(
      (a): a is string => !!a && !a.includes('.onion'),
    ),
    server: true,
    listen: true,
    rpcbind: '0.0.0.0',
    rpcallowip: '0.0.0.0/0',
    // rpcport, port and the network selection are daemon arguments, so that one
    // datadir can hold several networks. Clear any value carried in raw, which
    // would otherwise win over the argument.
    rpcport: undefined,
    port: undefined,
    apibind: `0.0.0.0:${apiPort}`,
    rest: rest ?? false,
    maxconnections: maxconnections ?? undefined,
    // Writing every network is the same as writing none, and omitting the key
    // is what the hub reads as "no restriction".
    onlynet:
      onlynetList.length > 0 && onlynetList.length < ALL_ONLYNETS.length
        ? onlynetList
        : undefined,
    addnode: addnodeList.length > 0 ? addnodeList : undefined,
    maxuploadtarget: maxuploadtarget ?? undefined,
    maxreceivebuffer: maxreceivebuffer ?? undefined,
    maxsendbuffer: maxsendbuffer ?? undefined,
    maxmempool: maxmempool ?? undefined,
    minrelaytxfee: minrelaytxfee ?? undefined,
    mempoolexpiry: mempoolexpiry ?? undefined,
    maxorphantx: maxorphantx ?? undefined,
    blocksizeacceptlimit: blocksizeacceptlimit ?? undefined,
    rpcthreads: rpcthreads ?? undefined,
    'use-thinblocks': true,
    'min-thin-peers': 2,
  }
}

export const floweeConfFile = FileHelper.ini(
  { base: sdk.volumes.main, subpath: '/flowee.conf' },
  fullConfigSpec.partialValidator,
  { bracketedArray: false },
  {
    onRead: (a) => fileToForm(shape.parse(a)),
    onWrite: (a) =>
      stringifyPrimitives(formToFile(a)) as Record<string, unknown>,
  },
)
