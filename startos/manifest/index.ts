import { setupManifest } from '@start9labs/start-sdk'
import { long, short, torDescription } from './i18n'

export const manifest = setupManifest({
  id: 'flowee',
  title: 'Flowee the Hub',
  license: 'GPL-3.0',
  packageRepo: 'https://github.com/Start9-Community/flowee-the-hub-startos',
  upstreamRepo: 'https://codeberg.org/Flowee/thehub',
  marketingUrl: 'https://flowee.org/',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    flowee: {
      source: {
        dockerBuild: {
          buildArgs: {
            // Upstream tag 2026.05.2, resolved to its immutable commit. Both
            // move together — see UPDATING.md.
            VERSION: '2026.05.2',
            COMMIT: 'd19571fcb5700d790a57be3b4035ddd3f75e9e10',
          },
        },
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {
    tor: {
      description: torDescription,
      optional: true,
      metadata: {
        title: 'Tor',
        icon: 'https://raw.githubusercontent.com/Start9Labs/tor-startos/65faea17febc739d910e8c26ff4e61f6333487a8/icon.svg',
      },
    },
  },
})
