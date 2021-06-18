import { Increment } from './increments'

export interface ParsedCommit {
  increment: Increment
  scopes: string[]
}
