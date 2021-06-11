import { readFileSync } from 'jsonfile'
import never from 'never'
import { parse, plugins, applyPlugins } from 'parse-commit-message'
import { getOctokit } from '@actions/github'
import {} from '@octokit/types'
const increments = ['patch', 'minor', 'major'] as const
type Increment = typeof increments[number]

(async () => {
  const octokit = getOctokit(process.env.GITHUB_TOKEN ?? never('No GITHUB_TOKEN'), {
    baseUrl: process.env.GITHUB_API_URL
  })
  const eventFile = process.env.GITHUB_EVENT_PATH ?? never('No GITHUB_EVENT_PATH')
  const event = readFileSync(eventFile)
  console.log(event)
  if (event.pull_request === undefined) {
    throw new Error('Cannot run on non pull request events.')
  }
  console.log(`Fetching ${event.pull_request.commits as number} commits.`)
  const { data } = await octokit.rest.pulls.listCommits({
    repo: event.repository.name,
    owner: event.repository.owner.login,
    pull_number: event.pull_request.number
  })
  console.log('Parsing commit messages')
  const increment = increments[Math.max(...data.map(({ commit: { message } }) => {
    const messageHeader = message.split('\n')[0]
    let increment: Increment | false
    try {
      increment = applyPlugins(plugins[1], parse(message))[0].increment
    } catch (e) {
      throw new Error(`Invalid Commit Message: ${messageHeader}. ${(e as Error).message}`)
    }
    console.log(
      `Message: ${messageHeader}. ` +
      `Increment: ${increment === false ? 'none' : increment}.`)
    return increment === false ? -1 : increments.indexOf(increment)
  }))]
  console.log(`Largest increment: ${increment}`)
})()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
