import testGhAction from '../test-lib/testGhAction'
import { join } from 'path'

test('works', async () => {
  const { stdout } = await testGhAction(join(__dirname, '../dist/index.js'), {
    event: {
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
  })
  console.log(stdout)
})
