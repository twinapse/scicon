# SciCon documentation site

This directory contains the Docusaurus site for SciCon.
The canonical documentation source remains the repository root `docs/` directory.

`website/docs/` is generated at build time and is intentionally git-ignored.
Do not edit generated files by hand.

## Requirements

Docusaurus 3.10 requires Node.js 20 or newer.
Use the repository root `docs/` files as the source of truth for published documentation content.

## Local development

Install dependencies:

```bash
npm ci
```

Generate the publishable docs from the canonical source docs:

```bash
npm run build-docs
```

Start the development server:

```bash
npm run start
```

Build the production site:

```bash
npm run build
```

Serve the static build locally:

```bash
npm run serve
```

The landing page video defaults to the hosted SciCon demo in `twinapse/scicon-assets`.
Set `SCICON_HOMEPAGE_VIDEO_URL` to override that video URL.
Set `SCICON_HOMEPAGE_VIDEO_POSTER` to override the fallback poster.
Heavy visuals should live in `twinapse/scicon-assets` and be referenced by URL.
Keep references to that repository out of the public site UI because it is an internal implementation detail.
