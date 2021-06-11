/* eslint-disable no-extra-boolean-cast */
import { readFileSync } from 'jsonfile'
import never from 'never'
import { parse, plugins, applyPlugins } from 'parse-commit-message'
import { getOctokit } from '@actions/github'
import increments, { Increment } from './increments'
import getLabelName from './getLabelName'
import diff from 'arr-diff'

(async () => {
  const octokit = getOctokit(process.env.GITHUB_TOKEN ?? never('No GITHUB_TOKEN'), {
    baseUrl: process.env.GITHUB_API_URL
  })
  const eventFile = process.env.GITHUB_EVENT_PATH ?? never('No GITHUB_EVENT_PATH')
  const event = readFileSync(eventFile)
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
      throw new Error(
        `Invalid Commit Message: ${messageHeader}\n` +
        `Messages should follow: ${(e as Error).message.split('\n')[1]}`)
    }
    console.log(
      `Message: ${messageHeader}. ` +
      `Increment: ${increment === false ? 'none' : increment}.`)
    return increment === false ? 0 : increments.indexOf(increment)
  }))]
  console.log(`Largest increment: ${increment}`)
  console.log('Updating pull request labels')
  const incrementLabels = increments.map(v => getLabelName(v))
  const labels = (event.pull_request.labels as Array<{ name: string}>)
    .map(({ name }) => name)
    .filter(name => incrementLabels.includes(name))
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  console.log(`Current increment labels: ${labels.join(', ') || '*none*'}`)
  const desiredLabel = getLabelName(increment)
  const desiredLabels = [desiredLabel]
  console.log(`Desired increment label: ${desiredLabel}`)
  const addLabels = diff(desiredLabels, labels)
  const removeLabels = diff(labels, desiredLabels)
  if (!Boolean(addLabels.length + removeLabels.length)) {
    console.log('Labels up to date. No changes necessary.')
  } else {
    if (Boolean(addLabels.length)) console.log(`Adding labels: ${addLabels.join(', ')}.`)
    if (Boolean(removeLabels.length)) console.log(`Removing labels: ${removeLabels.join(', ')}.`)
    await Promise.all([
      octokit.rest.issues.addLabels({
        repo: event.repository.name,
        owner: event.repository.owner.login,
        issue_number: event.pull_request.number,
        labels: addLabels
      }),
      ...removeLabels.map(async name => await octokit.rest.issues.removeLabel({
        repo: event.repository.name,
        owner: event.repository.owner.login,
        issue_number: event.pull_request.number,
        name
      }))
    ])
    console.log('Done!')
  }
})()
  .catch(e => {
    console.error(e.message)
    process.exit(1)
  })
