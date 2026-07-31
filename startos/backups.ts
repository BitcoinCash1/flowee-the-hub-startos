import { sdk } from './sdk'

export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  sdk.Backups.ofVolumes('main').setOptions({
    // Everything here is re-derived from the network or from the block files,
    // and together it is the entire multi-gigabyte bulk of the volume. The
    // patterns are unanchored so they also match a test network's subdirectory.
    exclude: [
      'blocks/',
      'unspent/',
      'txindex/',
      'peers.dat',
      'banlist.dat',
      'hub.log',
      '.lock',
      '.cookie',
      'floweethehub.pid',
    ],
  }),
)
