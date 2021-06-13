import { Commit, Label, PullRequest as IPullRequest } from './testGhAction'

class PullRequest implements IPullRequest {
  commits: Commit[] = []
  labels: Label[] = []
}

export default PullRequest
