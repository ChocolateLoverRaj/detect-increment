import testGhAction from '../../test-lib/testGhAction'
import { join } from 'path'
import PullRequest from '../../test-lib/PullRequest'
import assignSame from '../../test-lib/assignSame'

test('pull request', async () => {
  const { stdout, outputs } = await testGhAction(join(__dirname, '../../dist/index.js'), {
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
