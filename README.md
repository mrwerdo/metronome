# Welcome to Remix + Cloudflare!

- [Remix Docs](https://remix.run/docs)
- [Remix Cloudflare docs](https://remix.run/guides/vite#cloudflare)

## Development

From your terminal:

```sh
npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

To run Wrangler:

```sh
npm run build
npm run start
```

This command loads the sql schema into the local database:

```
npm exec wrangler d1 execute -- metronome --file sql/schema.sql
# or
npm run seed
```


This command generates types from the database schema:
```
DATABASE_URL=$(find .wrangler -type f -name '*.sqlite')
DATABASE_URL=$(find .wrangler -type f -name '*.sqlite') npm exec kysely-codegen -- --out-file app/db.d.ts
# or
npm run dbtypegen
```


This one shows tables from the database:
```
% npm exec wrangler d1 -- execute metronome --command "SELECT S.id AS songId, 
       S.name AS songName,
       S.favorite,
       S.instrument,
       S.createdAt,
       B.id AS barId,
       B.songId,
       B.name AS barName,
       B.bpm,
       B.timeSignature,
       B.subBeats,
       B.delay,
       B.numberOfBars
FROM Songs S
JOIN Bars B ON S.id = B.songId;"
```

## Typegen

Generate types for your Cloudflare bindings in `wrangler.toml`:

```sh
npm run typegen
```

You will need to rerun typegen whenever you make changes to `wrangler.toml`.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then, deploy your app to Cloudflare Pages:

```sh
npm run deploy
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.


# Key Dependencies

- [kysely](https://kysely.dev/docs/intro)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)