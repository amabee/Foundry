# Foundry marketplace

The Extensions and Plugins catalogue uses the repository’s published registry, local source artwork and manifest permissions. Blocked sources stay excluded; experimental availability is shown honestly. Adult sources are hidden until the visitor opts in. Plugins have an empty state until the registry publishes one.

From the Foundry repository:

```sh
pnpm site:build
pnpm site:test
node site/serve.mjs
```

The preview is at http://127.0.0.1:5198. `site/dist/` is the deployable static output. No tokens, API keys, server, or account database are required. A build packages the current reviewed registry; rebuild the site after publishing catalogue changes. Installation copies a pinned manifest URL into Nova’s existing permission-review flow. It does not execute source payloads or silently install extensions.

## Self-hosting

Use these settings on your static host:

- Project root: the Foundry repository root.
- Build command: `node site/build.mjs` (Node 22 or newer).
- Publish/output directory: `site/dist`.
- Framework preset: none/static.
- Environment variables: none.

For Vercel, import the repository with **Root Directory `./`**. The root `vercel.json` supplies the build command, skips dependency installation, and serves `site/dist`. Redeploy the latest `main` commit after changing the settings.

For a manual deployment, run the build locally and upload the contents of `site/dist/`. Keep its `assets/` folder and JSON files alongside `index.html`. Search, filters and extension details run in the browser; there is no server to deploy. The site is not connected to a GPT account or a hosted Sites project.

Site assets use relative paths, so the same output supports a static subdirectory host. Source fonts are Oswald and Archivo from Google Fonts under the included OFL licenses; source logos retain their source identity.

The header and footer use `assets/foundry-mascot-girl.png`; the favicon and touch icon use `assets/foundry-mascot-icon.png`. Both are transparent PNGs generated from the Vestra mascot reference. Generation prompts are kept in `design/`.
