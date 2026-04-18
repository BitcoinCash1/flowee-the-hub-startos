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
    // API
    apilisten: iniString,
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

export const fullConfigSpec = InputSpec.of({
  raw: Value.hidden(shape),

  // ── Node Settings ──────────────────────────────────────────────────────────
  rest: Value.toggle({
    name: 'REST API',
    description: 'Accept public REST requests. Provides HTTP-based access to blockchain data.',
    default: false,
  }),

  // ── Connection ─────────────────────────────────────────────────────────────
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
})

function fileToForm(
  input: z.infer<typeof shape>,
): T.DeepPartial<typeof fullConfigSpec._TYPE> {
  const {
    rest, maxconnections, addnode,
    maxmempool, minrelaytxfee, mempoolexpiry,
    blocksizeacceptlimit, rpcthreads,
  } = input

  return {
    raw: input ?? {},
    rest,
    maxconnections,
    addnode: addnode?.filter((v): v is string => !!v) ?? [],
    maxmempool,
    minrelaytxfee,
    mempoolexpiry,
    blocksizeacceptlimit,
    rpcthreads,
  }
}

function formToFile(
  input: T.DeepPartial<typeof fullConfigSpec._TYPE>,
): z.infer<typeof shape> {
  const {
    raw, rest, maxconnections, addnode,
    maxmempool, minrelaytxfee, mempoolexpiry,
    blocksizeacceptlimit, rpcthreads,
  } = input

  return {
    ...raw,
    server: true,
    listen: true,
    rpcbind: '0.0.0.0',
    rpcallowip: '0.0.0.0/0',
    rpcport: 8332,
    port: 8333,
    apilisten: '0.0.0.0:1235',
    rest: rest ?? false,
    maxconnections: maxconnections ?? undefined,
    addnode: addnode && (addnode as string[]).length > 0 ? (addnode as string[]).filter(Boolean) : undefined,
    maxmempool: maxmempool ?? undefined,
    minrelaytxfee: minrelaytxfee ?? undefined,
    mempoolexpiry: mempoolexpiry ?? undefined,
    blocksizeacceptlimit: blocksizeacceptlimit ?? undefined,
    rpcthreads: rpcthreads ?? undefined,
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
