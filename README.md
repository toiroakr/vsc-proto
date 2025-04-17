# vsc-sync

vsc-sync is a CLI tool designed to share `.vscode/settings.json` within a development team.

It allows teams to establish and maintain a set of common settings, while also providing the flexibility for individual team members to override these settings according to their preferences.

## Installation

```bash
npm install -D vsc-sync
```

## Usage

### Initialization

```bash
vsc-sync init
```

- Adds the following to `.gitignore`:
  ```
  .vscode/settings.json
  .vscode/settings-local.json
  ```
- If `.vscode/settings.json` exists, copies it to `.vscode/settings-project.json`.
- Creates an empty `.vscode/settings-local.json` if it doesn't exist.

### Synchronization

```bash
vsc-sync sync
```

- Merges `.vscode/settings-project.json` and `.vscode/settings-local.json` to create `.vscode/settings.json`.
- It's recommended to run this command with a Git post-checkout hook.

#### Git Hook Setup

**[Husky](https://typicode.github.io/husky/get-started.html)**

```bash
npm install husky --save-dev
npx husky init
```

`.husky/post-checkout`
```sh
npx vsc-sync sync
```

**[Lefthook](https://github.com/evilmartians/lefthook/blob/master/README.md)**

`lefthook.yml`
```yaml
post-checkout:
  jobs:
    name: sync vscode settings
    run: npx vsc-sync sync
```

```bash
npm install lefthook --save-dev
npx lefthook install
```
