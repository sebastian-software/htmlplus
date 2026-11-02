# Contributing to html+

html+ is an early prototype. Open an issue before starting a new element or a larger change, so the scope can be checked against the [component and application boundary](docs/adr/0007-component-application-boundary.md).

## Set up

You need Node.js 22 or later and npm.

```sh
npm ci
npx playwright install chromium firefox webkit
npm run dev
```

The playground runs at <http://127.0.0.1:4173/demo/>; the project site is at <http://127.0.0.1:4173/>.

## Check your change

| Command | What it runs |
| --- | --- |
| `npm run lint` | Biome formatting and lint rules; `npm run format` applies safe fixes |
| `npm run typecheck` | Strict TypeScript |
| `npm run test:unit` | Unit tests in `test/*.test.mjs` against the built modules |
| `npm run test:browser` | Browser tests in `test/*.spec.mjs` |
| `npm run check:size` | Build output against the limits in `scripts/check-size.mjs` |
| `npm run docs:api` | Regenerates [the element reference](docs/ELEMENTS.md) from `src/` |
| `npm test` | Everything above, as CI runs it |

Pass Playwright options through `npm test`, for example `npm test -- --project=chromium`. Firefox does not currently launch under Playwright on macOS ([upstream issue](https://github.com/microsoft/playwright/issues/42768)), so on a Mac run `npm test -- --project=chromium --project=webkit` and rely on CI for Firefox.

Test failures in CI upload their traces and screenshots as a `playwright-results` artifact on the workflow run.

## Add an element

1. Compare it with native HTML first. Add it only if it fills a real gap and stays within [ADR-0007](docs/adr/0007-component-application-boundary.md).
2. Define its value contract: the `FormData` entries, default, reset, validation, disabled state, and events. Record a new kind of value in an ADR.
3. Register it in `src/index.ts`, both in the definition list and in `HTMLElementTagNameMap`.
4. Add its summary and guide link to `scripts/generate-api.mjs`, then run `npm run docs:api`.
5. Give it a built-in neutral base with deliberate parts, and list it in `demo/shadcn.css`.
6. Add a Base and a styled recipe to `demo/recipes.ts`, and add fields to the playground in `demo/index.html`.
7. Add it to the catalog on the project site in `landing/index.html` and to the table in the README.
8. Cover it with browser tests. No element is complete on keyboard logic alone: check `FormData`, reset, fieldsets, labels, and validation.
9. Add any new bundled dependency to `THIRD_PARTY_NOTICES.txt`. `npm run check:notices` fails if one is missing.

## Project conventions

- US English in everything in the repository. See [AGENTS.md](AGENTS.md).
- [Conventional Commits](https://www.conventionalcommits.org/), such as `feat: add tag input` or `fix: preserve native undo during normalization`.
- Rationale belongs in [living ADRs](docs/adr/README.md), which are edited in place with a dated change note. Delivery order belongs in the [project plan](docs/PLAN.md). User-visible changes go in the [changelog](CHANGELOG.md).

By contributing, you agree that your contribution is licensed under the [Apache License 2.0](LICENSE).

## Deployment

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) runs `npm test` on pull requests and on `main`, along with a Node.js 22 job that runs the unit tests. CI uses the official `mcr.microsoft.com/playwright` image with browsers and Linux dependencies preinstalled; keep its version aligned with Playwright in `package-lock.json` when upgrading.

Successful pushes to `main` and manual runs deploy the `site/` export to GitHub Pages, which uses **GitHub Actions** as its publishing source. Pull requests verify without deploying. The project site is at the root, and the playground and gallery are under `/demo/`. The site runs entirely in the browser, with no application backend or analytics.

To preview the export locally, under the same repository subpath that the tests use:

```sh
npm run build:demo
node scripts/serve.mjs --site --port 48165
```

Then open <http://127.0.0.1:48165/htmlplus/>. Relative URLs support both repository subpaths and custom domains, so `/htmlplus/` is not required on a custom domain. `htmlplus.dev` is reserved and not live yet; its DNS and Pages settings are separate configuration.
