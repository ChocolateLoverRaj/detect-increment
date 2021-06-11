const increments = ['none', 'patch', 'minor', 'major'] as const
export type Increment = typeof increments[number]
export default increments
