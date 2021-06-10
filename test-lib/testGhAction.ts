import { spawn } from 'child_process'
import streamToString from 'stream-to-string'
import { once } from 'events'
import { EOL } from 'os'
import { join } from 'path'
import { writeFile } from 'jsonfile'
import defaults from 'object.defaults'

interface Result {
  outputs: Record<string, string>
  stdout: string
}

interface Commit {
  message: string
}

interface Event {
  commits: Commit[]
}

interface Options {
  inputs: Record<string, string>
  event: Event
}

const testGhAction = async (file: string, partialOptions: Partial<Options> = {}): Promise<Result> => {
  const options: Options = defaults(partialOptions, { inputs: [], event: { commits: [] } })
  const { event, inputs } = options
  const eventFile = join(__dirname, '../test-tmp/event.json')
  await writeFile(eventFile, event, { spaces: 2 })
  const c = spawn('node', [file], {
    env: {
      ...process.env,
      GITHUB_EVENT_PATH: eventFile,
      ...Object.fromEntries(Object.entries(inputs).map(([k, v]) => [`INPUT_${k.toUpperCase()}`, v]))
    }
  })
  const stdoutStrPromise = streamToString(c.stdout)
  const stderrStr = streamToString(c.stderr)
  const [code] = await once(c, 'exit')
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
