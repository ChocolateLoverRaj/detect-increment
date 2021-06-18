import testGhAction from '../../test-lib/testGhAction'
import { join } from 'path'
import PullRequest from '../../test-lib/PullRequest'
import assignSame from '../../test-lib/assignSame'

const mainFilePath = join(__dirname, '../../dist/index.js')

test('pull request', async () => {
  const { stdout, outputs } = await testGhAction(mainFilePath, {
    event: {
      number: 1
    },
    repo: {
      pullRequests: {
        1: assignSame(new PullRequest(), {
          commits: [{
            message: 'Feature: add triangles'
          }, {
            message: 'Breaking: replaced triangle with polygon'
          }, {
            message: 'Fix: polygons have minimum of 3 sides'
          }, {
            message: 'Chore: updated GitHub action script'
          }]
        })
      },
      token: 'token'
    },
    env: {
      GITHUB_TOKEN: 'token'
    }
  })
  expect(stdout).toMatchSnapshot()
  expect(outputs.increment).toBe('major')
})

test('push', async () => {
  const { stdout, outputs } = await testGhAction(mainFilePath, {
    event: {
      commits: [{
        message: 'Feat: add images'
      }, {
        message: 'Fix: fix bug about images'
      }]
    }
  })
  expect(stdout).toMatchSnapshot()
  expect(outputs.increment).toBe('minor')
})

test('PR merge', async () => {
  const { stdout, outputs } = await testGhAction(mainFilePath, {
    event: {
      commits: [{
        message: 'Merge pull request #24 from ChocolateLoverRaj/test-semver'
      }, {
        message: 'Feat: allow case insensitive words'
      }]
    }
  })
  expect(stdout).toMatchSnapshot()
  expect(outputs.increment).toBe('minor')
})

test('branch merge', async () => {
  const { stdout, outputs } = await testGhAction(mainFilePath, {
    event: {
      commits: [{
        message: "Merge branch 'main' into eslint-tsconfig-no-tests"
      }, {
        message: 'Chore: CI stuff'
      }]
    }
  })
  expect(stdout).toMatchSnapshot()
  expect(outputs.increment).toBe('none')
})

test('invalid commit message', async () => {
  await expect(testGhAction(join(__dirname, '../../dist/index.js'), {
    event: {
      number: 1
    },
    repo: {
      pullRequests: {
        1: assignSame(new PullRequest(), {
          commits: [{ message: 'made it better' }]
        })
      },
      token: 'token'
    },
    env: {
      GITHUB_TOKEN: 'token'
    }
  })).rejects.toMatchSnapshot()
})

test('scoped commits', async () => {
  const { outputs, stdout } = await testGhAction(mainFilePath, {
    event: {
      commits: [{
        message: 'breaking(react-json-input, antd): drop node 10 support'
      }]
    }
  })
  expect(outputs).toEqual({
    increment: 'major',
    increments_by_scope: JSON.stringify({ 'react-json-input': 'major', antd: 'major' })
  })
  expect(stdout).toMatchSnapshot()
})
