import { sdk } from '../sdk'
import { autoconfig } from './config/autoconfig'
import { mempoolSettings } from './config/mempoolSettings'
import { networkConfig } from './config/network'
import { nodeSettings } from './config/nodeSettings'
import { peerSettings } from './config/peerSettings'
import { deleteRpcCredentials } from './credentials/deleteCredentials'
import { createDependentCredential } from './credentials/dependentCredential'
import { generateRpcCredential } from './credentials/generateCredential'
import { deletePeerList } from './deletePeerList'
import { deleteTestNetworkData } from './deleteTestNetworkData'
import { deleteTransactionIndex } from './deleteTransactionIndex'
import { reindex } from './reindex'
import { runtimeInfo } from './runtimeInfo'

export const actions = sdk.Actions.of()
  .addAction(runtimeInfo)
  .addAction(networkConfig)
  .addAction(nodeSettings)
  .addAction(peerSettings)
  .addAction(mempoolSettings)
  .addAction(generateRpcCredential)
  .addAction(deleteRpcCredentials)
  .addAction(reindex)
  .addAction(deletePeerList)
  .addAction(deleteTransactionIndex)
  .addAction(deleteTestNetworkData)
  // Hidden — driven by other packages, not by the user.
  .addAction(autoconfig)
  .addAction(createDependentCredential)
