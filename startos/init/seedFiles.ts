import { floweeConfFile } from '../fileModels/flowee.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (!kind) return

  // install, update, restore: an empty merge writes every default the models
  // declare and repairs anything invalid, without touching keys we don't own.
  await storeJson.merge(effects, {})
  await floweeConfFile.merge(effects, {})
})
