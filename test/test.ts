import testGhAction from '../test-lib/testGhAction'
import { join } from 'path'

test('works', async () => {
  const labels = [{
    name: 'Semver Increment: Minor'
  }, {
    name: 'enhancement'
  }, {
    name: 'Semver Increment: Patch'
  }]
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
          }],
          // Even fixes labels that wouldn't happen
          // (if the owner manually adds these labels it will be fixed)
          labels
        }
      },
      token: 'token'
    },
    env: {
      GITHUB_TOKEN: 'token'
    }
  })
  expect(stdout).toMatchSnapshot()
  expect(labels).toEqual([{ name: 'enhancement' }, { name: 'Semver Increment: Major' }])
})

test('invalid commit message', async () => {
  await expect(testGhAction(join(__dirname, '../dist/index.js'), {
    event: {
      number: 1
    },
    repo: {
      pullRequests: {
        1: {
          commits: [{ message: 'made it better' }],
          labels: []
        }
      },
      token: 'token'
    },
    env: {
      GITHUB_TOKEN: 'token'
    }
  })).rejects.toMatchSnapshot()
})
