import { sdk } from '../sdk'
import { autoconfig } from './config/autoconfig'
import { nodeSettings } from './config/nodeSettings'
import { rpcPeersSettings } from './config/rpcPeersSettings'
import { mempoolSettings } from './config/mempoolSettings'
import { viewRpcCredentials } from './credentials'
import { generateRpcCredential } from './generateCredential'
import { deleteRpcCredentials } from './deleteRpcCredentials'
import { runtimeInfo } from './runtimeInfo'
import { reindex } from './reindex'

export const actions = sdk.Actions.of()
  // ── Hidden (cross-package) ──────────────────────────────────────────────────
  .addAction(autoconfig)
  // ── Info ────────────────────────────────────────────────────────────────────
  .addAction(runtimeInfo)
  // ── Configuration ───────────────────────────────────────────────────────────
  .addAction(nodeSettings)
  .addAction(rpcPeersSettings)
  .addAction(mempoolSettings)
  // ── Credentials ─────────────────────────────────────────────────────────────
  .addAction(viewRpcCredentials)
  .addAction(generateRpcCredential)
  .addAction(deleteRpcCredentials)
  // ── Maintenance ─────────────────────────────────────────────────────────────
  .addAction(reindex)
