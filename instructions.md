# Flowee the Hub

## Documentation

- [Flowee the Hub documentation](https://flowee.org/docs/hub/) — the upstream guide to running
  and configuring the Hub.
- [Flowee the Hub source](https://codeberg.org/Flowee/thehub) — the upstream repository, including
  the full `flowee.conf` reference.

## What you get on StartOS

- A **Bitcoin Cash full node** that validates and relays blocks and transactions.
- A **JSON-RPC interface** that wallets, explorers and other StartOS services connect to.
- A **transaction index**, built by a second process that runs alongside the node, for looking up
  transactions and addresses without scanning the chain.
- **Flowee's own binary interface**, which Flowee-native clients use instead of JSON-RPC.
- A choice of network: mainnet, Testnet3, Testnet4, Scalenet, Chipnet or Regtest.

## Getting set up

There is nothing to configure before the node is useful.

1. Start Flowee. It begins downloading the chain immediately.
2. Watch **Blockchain Sync** on the Dashboard. A full mainnet sync takes hours to days, depending
   on your disk and connection.
3. **Transaction Indexer** builds at the same time and finishes shortly after the sync does.

You will get a notification when the chain is fully synced.

## Using Flowee

### Connecting a wallet or explorer

Run **Generate RPC Credential**, give it a username, and Flowee returns the password. **Save it
before you close the result** — only a hash is kept, so it cannot be shown again. Restart Flowee
for the new credential to work, then point your wallet at the RPC interface with that username and
password.

**Delete RPC Credentials** revokes credentials you no longer want; the change takes effect at the
next restart.

Other StartOS services that depend on Flowee set their own credentials up automatically.

### Choosing a network

**Network** switches between mainnet and the test networks. Flowee restarts and syncs the new
network from the beginning; the data for the network you left is kept, so switching back resumes
where it stopped. The ports stay the same across networks, so anything already connected to Flowee
keeps working — it will just be looking at a different chain.

**Delete Test Network Data** reclaims the disk a test network is using. It will not delete the
network you are currently on.

### Privacy and reachability

**Peer & Privacy Settings** controls how the node talks to the rest of the network:

- **Route Peer Traffic Through Tor** sends outbound connections through Tor, so peers see a Tor
  exit node rather than your IP address. Install the Tor service first. It slows the initial sync
  down considerably, so it is usually worth turning on only once the chain has caught up.
- **Advertise Public Address** tells peers the public addresses StartOS has given the peer
  interface, so they can connect to you. Leave it off if you only want outbound connections.
- **Allowed Networks** limits the node to IPv4 or IPv6.

### Other settings

- **Node Settings** — the largest block the node will accept, and an optional read-only REST API.
  The REST API has no password, so only enable it if you are comfortable with anyone who can reach
  the RPC interface reading blockchain data.
- **Mempool Settings** — how much memory unconfirmed transactions may use, how long they are kept,
  and the minimum fee to relay them.

### Maintenance

- **Node Info** shows the version, chain, peer count and sync progress at a glance.
- **Reindex Blockchain** re-verifies every block you already have. Run it if the node reports a
  corrupt database. It takes hours.
- **Delete Transaction Index** discards the index and rebuilds it on the next start.
- **Delete Peer List** makes the node forget the peers it knows and find new ones.

## Limitations

- Flowee cannot use modern onion addresses, so it cannot accept inbound connections over Tor and
  cannot connect to onion peers. Tor is useful here only for hiding your IP address on outbound
  connections.
- Flowee always stores the full chain — there is no pruned mode.
- Backups keep your configuration and credentials but not the chain data or the transaction index.
  After a restore, Flowee syncs again from the network.
