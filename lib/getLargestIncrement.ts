import increments, { Increment } from './increments'
import { ParsedCommit } from './parsedCommit'

const getLargestIncrement = (commits: ParsedCommit[]): Increment =>
  increments[Math.max(...commits.map(({ increment }) => increments.indexOf(increment)))]

export default getLargestIncrement
