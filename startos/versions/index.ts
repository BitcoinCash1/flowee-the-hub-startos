import { VersionGraph } from '@start9labs/start-sdk'
import { v_2026_5_2_4 } from './v2026.5.2.4'
import { v_2026_5_2_3 } from './v2026.5.2.3'
import { v_2026_5_2_2 } from './v2026.5.2.2'
import { v_2026_5_2_1 } from './v2026.5.2.1'
import { v_2026_5_2_0 } from './v2026.5.2.0'
import { v_2026_5_1_1 } from './v2026.5.1.1'
import { v_2026_5_1_0 } from './v2026.5.1.0'
import { v_2026_5_0_0 } from './v2026.5.0.0'
import { v_1_0_0_0 } from './v1.0.0.0'

export const versionGraph = VersionGraph.of({
  current: v_2026_5_2_4,
  other: [v_2026_5_2_3, v_2026_5_2_2, v_2026_5_2_1, v_2026_5_2_0, v_2026_5_1_1, v_2026_5_1_0, v_2026_5_0_0, v_1_0_0_0],
})
