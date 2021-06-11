import testGhAction from '../test-lib/testGhAction'
import { join } from 'path'

test('works', async () => {
  const { stdout } = await testGhAction(join(__dirname, '../dist/index.js'), {
    event: {
      number: 1
    },
    repo: {
      pullRequests: {
        1: {
          commits: [{
            message: 'Feature: add triangles'
          }, {
            message: 'Breaking: replaced triangle with polygon'
          }, {
            message: 'Fix: polygons have minimum of 3 sides'
          }, {
            message: 'Chore: updated GitHub action script'
          }]
        }
      },
      token: 'token'
    },
    env: {
      GITHUB_TOKEN: 'token'
    }
  })
  console.log(stdout)
})

test('invalid commit message', async () => {
  await expect(testGhAction(join(__dirname, '../dist/index.js'), {
    event: {
      number: 1
    },
    repo: {
      pullRequests: {
        1: {
          commits: [{ message: 'made it better' }]
        }
      },
      token: 'token'
    },
    env: {
      GITHUB_TOKEN: 'token'
    }
  })).rejects.toMatchSnapshot()
})
