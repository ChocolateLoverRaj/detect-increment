import { readFileSync } from 'jsonfile'
import never from 'never'
import { parse, plugins, applyPlugins } from 'parse-commit-message'

const increments = ['patch', 'minor', 'major'] as const
type Increment = typeof increments[number]

const eventFile = process.env.GITHUB_EVENT_PATH ?? never('No GITHUB_EVENT_PATH')
const event = readFileSync(eventFile)
console.log(event)
console.log(event.commits.length === 1
  ? 'Parsing commit message'
  : `Parsing ${event.commits.length as number} commit messages`)
const increment = increments[Math.max(...event.commits.map(({ message }) => {
  const { increment } = applyPlugins(plugins[1], parse(message))[0] as {
    increment: Increment | false
  }
  console.log(
    `Message: ${message.split('\n')[0] as string}. ` +
    `Increment: ${increment === false ? 'none' : increment}.`)
  return increment === false ? -1 : increments.indexOf(increment)
}))]
console.log(`Largest increment: ${increment}`)
