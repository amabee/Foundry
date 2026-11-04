# Vestra Foundry

Native extension sources and the extension registry for [Vestra](https://github.com/amabee/Vestra).

Registry URL — add it in **Extensions → Registries**:

```text
https://raw.githubusercontent.com/amabee/Foundry/main/extensions/registry.json
```

| Extension | Catalogue status |
| --- | --- |
| HentaiEra (18+) | Native manga source; paged search and reader metadata verified |
| Hentai2Read (18+) | Experimental native manga source; live metadata returned HTTP 403 |
| MangaBuddy (MangaK) | Native English manga source; paged search, chapters, reader metadata and sample image verified |
| MangaKatana | Native en manga; sandbox search, chapters, pages and sample image verified |
| MangaHub (Russian) | Native ru manga; sandbox search, chapters, pages and sample image verified |
| AsuraScans | Native en manga; sandbox search, chapters, pages and sample image verified |
| Atsumaru | Native en manga; sandbox search, chapters, pages and sample image verified |
| FanFox | Native en manga; sandbox search, chapters, pages and sample image verified |
| KuraManga | Native en manga; sandbox search, chapters, pages and sample image verified |
| LelManga (French) | Native fr manga; sandbox search, chapters, pages and sample image verified |
| MangaFreak | Native en manga; sandbox search, chapters, pages and sample image verified |
| RavenScans | Experimental native manga; Live metadata is blocked by an automated-access challenge. |
| MangaStash | Native en manga; sandbox search, chapters, pages and sample image verified |
| MangaBats (Manganato) | Experimental native manga; Live metadata is blocked by an automated-access challenge. |
| Komiku (Indonesian) | Native id manga; sandbox search, chapters, pages and sample image verified |
| MyNimeKu (Indonesian Manga) | Native id manga; sandbox search, chapters, pages and sample image verified |
| MangaWorldAdult (Italian, 18+) | Native it manga; reader metadata and image headers verified |
| AnimeSama (French Manga) | Native fr manga; sandbox search, chapters, pages and sample image verified |
| Taiyo (Portuguese Manga) | Native pt manga; sandbox search, chapters, pages and sample image verified |
| xComic | Native en manga; sandbox search, chapters, pages and sample image verified |
| MangaBall | Experimental native manga; Search and 4228 multilingual chapters verified; image CDN returns HTTP 403 |
| MangaDot | Experimental native manga; Direct API requires browser verification (HTTP 403) |
| MangaFire | Native multi manga; sandbox search, chapters, pages and sample image verified |
| AnimeGG | Native en anime; Metadata verified; CDN redirects to HTTP, so guarded HTTPS media verification fails |
| AnimeHeaven | Native en anime; sandbox search, episodes, streams and media signature verified |
| AnimeSaturn Mirror | Native it anime; sandbox search, episodes, streams and media signature verified |
| AnimeUnion | Native it anime; sandbox search, episodes, streams and media signature verified |
| AnimeUnity Mirror | Native it anime; sandbox search, episodes, streams and media signature verified |
| AnimeToast | Native de anime; Live metadata works; reviewed titles no longer expose the upstream MP4Upload mirror |
| Shonen | Native multi anime; sandbox search, episodes, streams and media signature verified |
| AniTube | Native pt anime; sandbox search, episodes, streams and media signature verified |
| MyNimeKu (Anime) | Native id anime; sandbox search, episodes, streams and media signature verified |
| DonghuaStream | Native en anime; Metadata verified; current titles use a newer StreamPlay mirror absent from the upstream extractor |
| NontonAnime | Native id anime; sandbox search, episodes, streams and media signature verified |
| AnimeAV1 | Native es anime; sandbox search, episodes, streams and media signature verified |
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

`pnpm build` bundles KissKH and the manga sources from their `src/` entries. Manga source utilities live in `lib/` and are compiled into each standalone payload. The other extensions are authored directly as standalone ES modules in `index.js`. `pnpm check` validates manifests, exact pinned registry payloads, method exports and offline activation. It does not test live streaming or replace Vestra's QuickJS sandbox tests.

The [Vestra SDK and runtime](https://github.com/amabee/Vestra/tree/main/packages/extension-host) stay in Vestra. This repository's compatibility workflow checks the sources against a pinned Vestra checkout and runs its sandbox/provider tests. Set `VESTRA_CHECKOUT` to a local Vestra checkout (defaults to sibling `../Vestra`) and run `pnpm test:sandbox` to replay all manga fixture assertions inside QuickJS with permission and result-schema checks. This is offline. Use `pnpm test:manga:live --live <folder> --sample-image` for an explicit live reader check, or `--image-headers` to check metadata and image headers without downloading image bytes.

All 21 manga providers from the reviewed Seanime catalogue have native ports. Seventeen passed live search/chapter/reader checks (MangaWorldAdult used image headers only). RavenScans, MangaBats, MangaDot, and MangaBall remain experimental due to upstream access restrictions; MangaBall metadata works but its image CDN returns HTTP 403. See `manga-ports.json` for the reviewed upstream revision and per-source status. These are checks at a point in time, not ongoing availability guarantees.

LelManga, MangaKatana, and large AnimeSama pages also need Nova’s public-CDN, binary-raster, and image-size fixes in Vestra commit `1eea0bbc429670f167c7b37b2c4505960db4d7d6` (`codex/manga-port-runtime`). The previously published v0.2.6 installer predates those fixes.

## Publishing a source change

1. Change the extension and bump its manifest version when behavior or permissions change. Run `pnpm build` when a source or shared helper changes.
2. Commit the source, manifest and generated payload together.
3. Run `pnpm registry:generate HEAD`. The registry references that complete commit SHA, never a mutable branch for executable code.
4. Run `pnpm test`, commit the registry update and open a pull request. Review host grants and catalogue status along with code changes.
5. Merge with a merge commit (or fast-forward), preserving the pinned source commit. Do not squash, rebase or force-rewrite published source history; CI checks that registry revisions remain ancestors of the current checkout.

`catalogue.json` records publication policy. StreamFlix stays blocked until its implementation and availability are verified. Vidlink remains explicitly experimental. Adding a source to the repository does not automatically make it installable from the registry.

Vestra retains a pinned, SHA-256-verified offline snapshot for bundled listings. Update that snapshot through Vestra's Foundry sync command after reviewing a Foundry commit; do not edit both repositories independently. Installed extensions and custom registry settings remain under the user's control.

## History and license

Extension history was extracted from `amabee/Vestra`'s `extensions/` directory at Vestra commit `1e319b70f5d98e3e42af0814109d9322c1804ce2`. Application code, account data, local configuration and unrelated Git history were not copied.

MIT; see [LICENSE](LICENSE). Preserve upstream attribution in source files. Never commit account tokens, credentials or private media URLs.
