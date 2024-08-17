# Welcome to Metronome by 10x10.dev

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

```sh
npm exec wrangler d1 execute -- metronome --file sql/schema.sql
# or
npm run seed
```


This command generates types from the database schema:
```sh
DATABASE_URL=$(find .wrangler -type f -name '*.sqlite') npm exec kysely-codegen -- --out-file app/db.d.ts
# or
npm run dbtypegen
```
If there are multiple files which end with `.sqlite` then this command may not give the expecetd output.

This one shows tables from the database:
```sh
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

First, delete the database and re-create it:
```
npm exec wrangler d1 execute -- metronome --remote --file sql/schema.sql
```

Then, deploy your app to Cloudflare Pages:

```sh
npm run deploy
```

## Key Dependencies

- [kysely](https://kysely.dev/docs/intro)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Remix Docs](https://remix.run/docs)
- [Remix Cloudflare docs](https://remix.run/guides/vite#cloudflare)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/guide/features.html#css)