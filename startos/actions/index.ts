import { sdk } from '../sdk'
import { autoconfig } from './config/autoconfig'
import { settings } from './config/settings'
import { viewCredentials } from './credentials'
import { generateCredential } from './generateCredential'
import { runtimeInfo } from './runtimeInfo'
import { reindex } from './reindex'

export const actions = sdk.Actions.of()
  // ── Hidden (cross-package) ──────────────────────────────────────────────────
  .addAction(autoconfig)
  // ── Info ────────────────────────────────────────────────────────────────────
  .addAction(runtimeInfo)
  // ── Configuration ───────────────────────────────────────────────────────────
  .addAction(settings)
  // ── Credentials ─────────────────────────────────────────────────────────────
  .addAction(viewCredentials)
  .addAction(generateCredential)
  // ── Maintenance ─────────────────────────────────────────────────────────────
  .addAction(reindex)
