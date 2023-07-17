# nosey

Nosey is a search app for [nostr](https://nostr.com).
Focus on supporting features similar to Twitter search directives.

- https://nosey.vercel.app

## Features

- `from:npub...` directive
- `from:@...` for npub completion (using NIP-50)
- `since:YYYY-MM-DD` and `until:YYYY-MM-DD` directives (limited support)

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.
