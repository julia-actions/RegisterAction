# RegisterAction

Register Julia packages via GitHub Actions.

## Basic Usage

Create and push a file `.github/workflows/register.yml` with the following contents:

```yml
name: Register Package
on:
  workflow_dispatch:
    inputs:
      version:
        description: Version to register or component to bump
        required: true
jobs:
  register:
    runs-on: ubuntu-latest
    steps:
      - uses: julia-actions/RegisterAction@latest
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

Then head over to your repository's Actions tab and click on the "Register Package" action.
On that page, click "Run workflow", fill in your desired version, then click "Run workflow".
Your Project.toml will be updated, and a comment triggering [Registrator](https://github.com/JuliaRegistries/Registrator.jl) will be made on the resulting commit.
You can also tell it to bump a version component rather than specifying the exact version.
To do this, use "major", "minor", or "patch" as the version input to perform the corresponding bump.

## Subdirectory Packages

To register packages in subdirectories, update your workflow file to the following:

```yml
on:
  workflow_dispatch:
    inputs:
      version:
        description: Version to register or component to bump
        required: true
      subdir:
        description: Subdirectory containing the package to register
```

Then fill out the value when triggering the action.
For example, if your `Project.toml` is at `julia/Project.toml`, then give it the value `julia`.

## Private Registries

If you're using an alternate or private registry with the Registrator GitHub App set up on it, then update your workflow file to the following:

```yml
      - uses: julia-actions/RegisterAction@latest
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          registrator: MyBotUsername
```
