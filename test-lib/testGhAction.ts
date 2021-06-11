import { spawn } from 'child_process'
import streamToString from 'stream-to-string'
import { once } from 'events'
import { EOL } from 'os'
import { join } from 'path'
import { writeFile } from 'jsonfile'
import defaults from 'object.defaults'
import getPort from 'get-port'
import express from 'express'
import { createServer } from 'http'

interface Result {
  outputs: Record<string, string>
  stdout: string
}

interface Commit {
  message: string
}

interface PullRequest {
  commits: Commit[]
}

interface Repo {
  pullRequests: Record<number, PullRequest>
  token?: string
}

interface PrEvent {
  number: number
}

interface Options {
  inputs: Record<string, string>
  event: PrEvent
  repo: Repo
  env: Record<string, string>
}

const testGhAction = async (file: string, partialOptions: Partial<Options> = {}): Promise<Result> => {
  const options: Options = defaults(partialOptions, { inputs: [], event: { number: 1 }, repo: { pullRequests: {} } })
  const { event, inputs, repo } = options
  const eventFile = join(__dirname, '../test-tmp/event.json')
  const port = await getPort()

  const server = express()
  const fakeGhServer = createServer(server).listen(port)

  server.get('/repos/ChocolateLoverRaj/test-semver/pulls/:number/commits', (req, res) => {
    const n = parseInt(req.params.number)
    const pr = repo.pullRequests[n]
    if (pr === undefined) {
      res.sendStatus(404)
      return
    }
    res.json(pr.commits.map(commit => ({ commit })))
  })

  await Promise.all([
    writeFile(eventFile, {
      pull_request: {
        commits: repo.pullRequests[event.number].commits.length,
        number: event.number
      },
      repo: {
        name: 'test-semver',
        owner: {
          login: 'ChocolateLoverRaj'
        }
      }
    }, { spaces: 2 }),
    once(fakeGhServer, 'listening')
  ])

  const c = spawn('node', [file], {
    env: {
      ...process.env,
      GITHUB_EVENT_PATH: eventFile,
      GITHUB_API_URL: `http://localhost:${port}`,
      ...Object.fromEntries(Object.entries(inputs).map(([k, v]) => [`INPUT_${k.toUpperCase()}`, v])),
      ...options.env
    }
  })
  const stdoutStrPromise = streamToString(c.stdout)
  const stderrStr = streamToString(c.stderr)
  const [code] = await once(c, 'exit')
  fakeGhServer.close()
  if (code !== 0) {
    throw new Error(
      `Process exited with code ${code as number}\n` +
      'Stderr is below:\n' +
      await stderrStr
    )
  }
  const setOutputStr = '::set-output name='
  const stdoutStr = (await stdoutStrPromise)
  return {
    outputs: Object.fromEntries(stdoutStr
      .split(EOL)
      .map(str => {
        if (str.startsWith(setOutputStr)) {
          const keyValue = str.slice(setOutputStr.length).split('::')
          if (keyValue.length !== 2) throw new Error('Bad set output syntax')
          return keyValue
        }
        return undefined
      })
      .filter(v => v !== undefined) as any
    ),
    stdout: stdoutStr
  }
}

export default testGhAction
