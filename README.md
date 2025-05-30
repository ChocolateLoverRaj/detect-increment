> [!WARNING]  
> I no longer use or maintain this library. I don't really code in JavaScript anymore (I switched to Rust). If you want to maintain or fork it let me know and I can put the link here.

# detect-increment

![Created with ](https://img.shields.io/badge/Created%20with-@programmerraj/create-3cb371?style=flat)
[![TS-Standard - Typescript Standard Style Guide](https://badgen.net/badge/code%20style/ts-standard/blue?icon=typescript)](https://github.com/standard/ts-standard)

## What This Does
Uses [`parse-commit-message`](https://www.npmjs.com/package/parse-commit-message#plugins) to detect if the version should be incremented to `major` (breaking change), `minor` (feature without breaking change), `patch` (bug fix), or `none` (no new release). If the commit message is a pull request merge message, that commit will be `none`.

This works by getting all the commit messages. It works on the `push` event, and on pull request events.

## Usage

### Pnpm
This project uses [Pnpm](https://pnpm.io/) to install dependencies. Use `pnpm/action-setup` before using this action.

### Environment Variables

#### `GITHUB_TOKEN`
This variable is needed for getting commits of a pull request. If running on the `push` event, this variable is not used.

### Outputs

#### `increment`
Will be either `none`, `patch`, `minor`, or `major`.

#### `increments_by_scope`
Will be a JSON object where the keys are the scopes, and the values are the increments.

## Examples
```yaml
# ...
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
    # ...
    - name: Setup Pnpm
      uses: pnpm/action-setup@v2.0.1
      with:
        version: 6.4
        run_install: true
    - id: get_increment
      name: Get Increment
      uses: ChocolateLoverRaj/detect-increment@v1.2
    - run: |
        echo ${{ steps.get_increment.outputs.increment }}
        echo ${{ steps.get_increment.outputs.increments_by_scopes }}
```
The example above will echo the increment. The output can be used with other steps, like automatically releasing a new version of a package.

Note that it says uses: `ChocolateLoverRaj/detect-increment@v1.2`. `v1.2` is a tag that will be updated to have the latest patch release. By using this tag, you can get a version with bug fixes without having to change any files. 
