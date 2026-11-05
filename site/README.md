# Foundry marketplace

The Extensions and Plugins catalogue uses the repository’s published registry, local source artwork and manifest permissions. Blocked sources stay excluded; experimental availability is shown honestly. Adult sources are hidden until the visitor opts in. Plugins have an empty state until the registry publishes one.

From the Foundry repository:

```sh
pnpm site:build
pnpm site:test
node site/serve.mjs
```

The preview is at http://127.0.0.1:5198. `site/dist/` is the deployable static output. No tokens, API keys, server, or account database are required. A build packages the current reviewed registry; rebuild the site after publishing catalogue changes. Installation copies a pinned manifest URL into Nova’s existing permission-review flow. It does not execute source payloads or silently install extensions.

The tracked `.openai/hosting.json` identifies the Sites deployment. Site assets use relative paths, so the same output supports a static subdirectory host. Source fonts are Oswald and Archivo from Google Fonts under the included OFL licenses; source logos retain their source identity.
