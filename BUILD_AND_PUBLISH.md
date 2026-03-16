# Build And Publish 3dviewer-sdk

This guide explains a full manual flow to build and publish `3dviewer-sdk` to npm.

## Choose The Right Flow First

Use one of these two flows:

- Continue publishing `3dviewer-sdk`: your npm account must already have publish permission for `3dviewer-sdk` (owner/collaborator).
- Publish under a new npm name: use `Publish With a New npm Package Name` if your account does not have permission for `3dviewer-sdk`.

## Goals

- Build TypeScript source from `sdk/src` into `sdk/dist`
- Validate package contents before release
- Publish a new npm version safely

## Prerequisites

- Node.js `>= 18` (latest LTS recommended)
- npm account (logged in)
- Publish access to `3dviewer-sdk` only if you use the standard flow below
- npm 2FA configured if your org requires it
- Clean git working tree, or a clear understanding of what will be released

## Relevant Structure

```text
repo-root/
  sdk/
    src/
    dist/
    package.json
```

All build/publish commands below run in `sdk/`.

## Standard Release Flow (3dviewer-sdk owners/collaborators)

### 1) Prepare release branch

```bash
git status
git pull
```

Make sure there are no unintended changes before release.

### 2) Bump version

Choose one version level:

```bash
cd sdk
npm version patch --no-git-tag-version
```

Or:

```bash
npm version minor --no-git-tag-version
npm version major --no-git-tag-version
```

### 3) Install dependencies

```bash
cd sdk
npm install
```

### 4) Build SDK

```bash
cd sdk
npm run build
```

Expected artifacts:

- `dist/index.js`
- `dist/index.mjs`
- `dist/index.d.ts`
- `dist/index.d.mts`

### 5) Validate package contents

```bash
cd sdk
npm pack --dry-run
```

Check that:

- Only required release files are included (mainly `dist`)
- No junk files are included (`node_modules`, temp files, local configs)

### 6) Authenticate npm and verify account

```bash
npm login
npm whoami
npm owner ls 3dviewer-sdk
```

If your account is not listed as owner/collaborator for `3dviewer-sdk`, skip this flow and use `Publish With a New npm Package Name`.

### 7) Publish to npm

Official release:

```bash
cd sdk
npm publish --access public
```

Pre-release (next tag):

```bash
cd sdk
npm publish --tag next --access public
```

## Publish With a New npm Package Name

If you want to change package name from `3dviewer-sdk` to another name, use this flow.

Important note:

- npm does not "rename" an already published package in place.
- You must publish a new package name.

### 1) Check new name availability

Unscoped package:

```bash
npm view <new-package-name> version
```

Scoped package:

```bash
npm view @<scope>/<new-package-name> version
```

If the command returns a version, that name already exists on npm.

### 2) Update `sdk/package.json`

Change:

```json
{
  "name": "<new-package-name>"
}
```

If using a scoped package and this is the first public publish for that scope, set:

```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

### 3) Build and dry-run pack

```bash
cd sdk
npm install
npm run build
npm pack --dry-run
```

### 4) Publish new name

```bash
cd sdk
npm publish --access public
```

### 5) Verify new package

```bash
npm view <new-package-name> version
npm install <new-package-name>@latest
```

### 6) (Optional) Deprecate old package name

```bash
npm deprecate 3dviewer-sdk@"*" "Package moved to <new-package-name>"
```

## Post Publish Verification

### 1) Confirm released version

```bash
npm view 3dviewer-sdk version
```

If you published with a different package name, run:

```bash
npm view <new-package-name> version
```

### 2) Install in another project

```bash
npm install 3dviewer-sdk@latest
```

If you published with a different package name, run:

```bash
npm install <new-package-name>@latest
```
