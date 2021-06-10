import { readFileSync } from 'jsonfile'
import never from 'never'
import { sync } from 'conventional-commits-parser'
import eslint from 'conventional-changelog-eslint'

console.log(eslint)
const eventFile = process.env.GITHUB_EVENT_PATH ?? never('No GITHUB_EVENT_PATH')
const events = readFileSync(eventFile)
console.log(events.commits.map(({ message }) => {
  return sync(message)
}))
