# RebuildAction

Register Julia packages via GitHub Actions.

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
