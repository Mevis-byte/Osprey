import { aircraft } from './aircraft'
import { maritime } from './maritime'
import { satellites } from './satellites'

export { aircraft }
export { maritime }
export { satellites }
export { feed } from './feed'

export const allAssets = [...aircraft, ...maritime, ...satellites]
