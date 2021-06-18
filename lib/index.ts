/* eslint-disable no-extra-boolean-cast */
import { readFileSync } from 'jsonfile'
import never from 'never'
import { parse, plugins, applyPlugins } from 'parse-commit-message'
import { getOctokit } from '@actions/github'
import { Increment } from './increments'
import { setOutput } from '@actions/core'
import PRMessageRegex from './PRMessageRegex'
import mergeMessageRegex from './mergeMessageRegex'
import listToStr from './listToStr'
import { ParsedCommit } from './parsedCommit'
import getLargestIncrement from './getLargestIncrement'

type Type = 'normal' | 'PRMerge' | 'merge'

const getType = (message: string): Type => PRMessageRegex.test(message)
  ? 'PRMerge'
  : mergeMessageRegex.test(message)
    ? 'merge'
    : 'normal'

const getExplanation = (type: Type): string => {
  switch (type) {
    case 'normal':
      return ''
    case 'PRMerge':
      return ' (pull request merge commit)'
    default:
      return ' (merge commit)'
  }
}

(async () => {
  const eventFile = process.env.GITHUB_EVENT_PATH ?? never('No GITHUB_EVENT_PATH')
  const event = readFileSync(eventFile)
  let commits: Array<{ message: string }>
  if (event.commits !== undefined) commits = event.commits
  else if (event.pull_request !== undefined) {
    const octokit = getOctokit(process.env.GITHUB_TOKEN ?? never('No GITHUB_TOKEN'), {
      baseUrl: process.env.GITHUB_API_URL
    })
    console.log(`Fetching ${event.pull_request.commits as number} commits.`)
    commits = (await octokit.rest.pulls.listCommits({
      repo: event.repository.name,
      owner: event.repository.owner.login,
      pull_number: event.pull_request.number
    })).data.map(({ commit }) => commit)
  } else {
    throw new Error('Cannot get commits for this event')
  }
  console.log('Parsing commit messages')
  const parsedCommits = commits.map<ParsedCommit>(({ message }) => {
    const messageHeader = message.split('\n')[0]
    let increment: Increment | false
    let scopes: string[] = []
    const type = getType(message)
    if (type === 'normal') {
      try {
        const commit = applyPlugins(plugins[1], parse(message))[0]
        increment = commit.increment
        if (typeof commit.header.scope === 'string') {
          scopes = (commit.header.scope as string).split(',').map(scope => scope.trim())
        }
      } catch (e) {
        throw new Error(
        `Invalid Commit Message: ${messageHeader}\n` +
        `Messages should follow: ${(e as Error).message.split('\n')[1]}`)
      }
    } else {
      increment = 'none'
    }
    console.log(
      `Message: ${messageHeader}. ` +
      `Increment: ${increment === false ? 'none' : increment}` +
      `${getExplanation(type)}. ` +
      `Scopes: ${listToStr(scopes)}.`)
    return {
      increment: increment === false ? 'none' : increment,
      scopes
    }
  })
  const allScopes = [...new Set(parsedCommits.flatMap(({ scopes }) => scopes))]
  const incrementsByScope = allScopes.map(scope => {
    const largestIncrement = getLargestIncrement(parsedCommits.filter(({ scopes }) => scopes.includes(scope)))
    return [scope, largestIncrement]
  })
  const increment = getLargestIncrement(parsedCommits)
  setOutput('increment', increment)
  setOutput('increments_by_scope', JSON.stringify(Object.fromEntries(incrementsByScope)))
  if (allScopes.length > 0) {
    incrementsByScope.forEach(([scope, increment]) => {
      console.log(`Largest increment for scope '${scope}': ${increment}`)
    })
  } else {
    console.log(`Largest increment: ${increment}`)
  }
})()
  .catch(e => {
    console.error(e.message)
    process.exit(1)
  })
