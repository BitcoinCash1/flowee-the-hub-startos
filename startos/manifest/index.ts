import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'flowee',
  title: 'Flowee the Hub',
  license: 'GPL-3.0',
  packageRepo: 'https://github.com/BitcoinCash1/flowee-the-hub-startos',
  upstreamRepo: 'https://codeberg.org/Flowee/thehub',
  marketingUrl: 'https://flowee.org/',
  donationUrl: null,
  docsUrls: [
    'https://github.com/BitcoinCash1/flowee-the-hub-startos/blob/master/instructions.md',
    'https://flowee.org/docs/hub/',
  ],
  description: { short, long },
  volumes: ['main'],
  images: {
    flowee: {
      source: { dockerBuild: {} },
      arch: ['x86_64', 'aarch64', 'riscv64'],
      emulateMissingAs: 'x86_64',
    },
  },
  alerts: {
    install:
      'Flowee the Hub will begin syncing the full BCH blockchain after installation. Initial sync may take several hours. Note: Flowee uses SPV-level validation — it follows the canonical chain (most PoW) but does not fully validate every transaction. This makes it unsuitable as sole mining node for block creation, but excellent for fast block propagation and relay.',
    update: null,
    uninstall:
      'Uninstalling Flowee the Hub will permanently delete all blockchain data and configuration. Ensure you have a backup before proceeding.',
    restore:
      'Restoring Flowee the Hub will overwrite your current configuration. Blockchain data must be re-synced.',
    start: null,
    stop: null,
  },
  dependencies: {
    tor: {
      description:
        'Enables Tor onion routing for anonymous peer-to-peer connections. When Tor is installed and running, Flowee the Hub automatically routes all connections through the Tor network for enhanced privacy.',
      optional: true,
      metadata: {
        title: 'Tor',
        icon: 'https://raw.githubusercontent.com/Start9Labs/tor-startos/65faea17febc739d910e8c26ff4e61f6333487a8/icon.svg',
      },
    },
  },
})
