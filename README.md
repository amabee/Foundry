# Vestra Foundry

Native extension sources and the extension registry for [Vestra](https://github.com/amabee/Vestra).

Registry URL — add it in **Extensions → Registries**:

```text
https://raw.githubusercontent.com/amabee/Foundry/main/extensions/registry.json
```

| Extension | Catalogue status |
| --- | --- |
| MovieBox | Available; previously verified guest playback |
| KissKH | Available; previously verified playback |
| Internet Archive | Available; previously verified archival playback |
| VixSrc | Available; requires Vestra's TMDb connection |
| DesiFlix | Available |
| Vidlink | Experimental; upstream playback checks have failed |
| StreamFlix | Source retained for development; excluded from the published registry |

Status records reflect earlier checks, not a guarantee that an upstream service is currently available. Sources remain optional and require Vestra's permission review before installation. Existing extension IDs and host grants are retained.

## Development

Use Node 22 or newer and pnpm 11.9.0:

```sh
pnpm install --frozen-lockfile
pnpm test
```

`pnpm build` bundles KissKH from `extensions/kisskh/src/`. Other extensions are authored directly as standalone ES modules in `index.js`. `pnpm check` validates manifests, exact pinned registry payloads, method exports and offline activation. It does not test live streaming or replace Vestra's QuickJS sandbox tests.

The [Vestra SDK and runtime](https://github.com/amabee/Vestra/tree/main/packages/extension-host) stay in Vestra. This repository's compatibility workflow checks the sources against a pinned Vestra checkout and runs its sandbox/provider tests. Integration/live commands in individual source READMEs refer to that Vestra checkout.

## Publishing a source change

1. Change the extension and bump its manifest version when behavior or permissions change. Build KissKH if its source changed.
2. Commit the source, manifest and generated payload together.
3. Run `pnpm registry:generate HEAD`. The registry references that complete commit SHA, never a mutable branch for executable code.
4. Run `pnpm test`, commit the registry update and open a pull request. Review host grants and catalogue status along with code changes.
5. Merge with a merge commit (or fast-forward), preserving the pinned source commit. Do not squash, rebase or force-rewrite published source history; CI checks that registry revisions remain ancestors of the current checkout.

`catalogue.json` records publication policy. StreamFlix stays blocked until its implementation and availability are verified. Vidlink remains explicitly experimental. Adding a source to the repository does not automatically make it installable from the registry.

Vestra retains a pinned, SHA-256-verified offline snapshot for bundled listings. Update that snapshot through Vestra's Foundry sync command after reviewing a Foundry commit; do not edit both repositories independently. Installed extensions and custom registry settings remain under the user's control.

## History and license

Extension history was extracted from `amabee/Vestra`'s `extensions/` directory at Vestra commit `1e319b70f5d98e3e42af0814109d9322c1804ce2`. Application code, account data, local configuration and unrelated Git history were not copied.

MIT; see [LICENSE](LICENSE). Preserve upstream attribution in source files. Never commit account tokens, credentials or private media URLs.
