import { readFileSync } from 'jsonfile'
import never from 'never'

const eventFile = process.env.GITHUB_EVENT_PATH ?? never('No GITHUB_EVENT_PATH')

console.log(readFileSync(eventFile))
