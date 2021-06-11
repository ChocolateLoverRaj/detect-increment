import { Increment } from './increments'
import capitalize from 'capitalize'

const getLabelName = (increment: Increment): string => `Semver Increment: ${capitalize(increment)}`

export default getLabelName
