# vsc-proto

vsc-proto is a CLI tool designed to share `.vscode/settings.json` within a development team.

It allows teams to establish and maintain a set of common settings, while also providing the flexibility for individual team members to override these settings according to their preferences.

## Installation

```bash
npm install -D vsc-proto
```

## Usage

### Initialization

```bash
vsc-proto init
```

- Adds the following to `.gitignore`:
  ```
  .vscode/settings.json
  .vscode/settings-local.json
  ```
- If `.vscode/settings.json` exists, copies it to `.vscode/settings-project.json`.
- Creates an empty `.vscode/settings-local.json` if it doesn't exist.

#### Options

- `--dir, -d`: Specify a custom directory for VS Code settings (default: `.vscode` in the Git root directory)

  ```bash
  vsc-proto init --dir /path/to/custom/vscode/dir
  ```

### Synchronization

```bash
vsc-proto sync
```

- Merges `.vscode/settings-project.json` and `.vscode/settings-local.json` to create `.vscode/settings.json`.
- It's recommended to run this command with a Git post-checkout hook.

#### Options

- `--dir, -d`: Specify a custom directory for VS Code settings (default: `.vscode` in the Git root directory)

  ```bash
  vsc-proto sync --dir /path/to/custom/vscode/dir
  ```

#### Git Hook Setup

**[Husky](https://typicode.github.io/husky/get-started.html)**

```bash
npm install husky --save-dev
npx husky init
```

`.husky/post-checkout`
```sh
npx vsc-proto sync
```

**[Lefthook](https://github.com/evilmartians/lefthook/blob/master/README.md)**

`lefthook.yml`
```yaml
post-checkout:
  jobs:
    name: sync vscode settings
    run: npx vsc-proto sync
```

```bash
npm install lefthook --save-dev
npx lefthook install
```

## Development

### Testing

The project uses [Vitest](https://vitest.dev/) for testing. Tests are located in the `test` directory.

#### Running Tests

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch
```
