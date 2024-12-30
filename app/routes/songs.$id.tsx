import { json } from "@remix-run/cloudflare";
import { Form, useLoaderData, useFetcher, useSubmit, Outlet, Link } from "@remix-run/react";
import { useState, type FunctionComponent } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import invariant from "tiny-invariant";
import { getSong, setFavorite, updateSong } from "../data";
import type { SongRecord } from "../data";
import { MetronomeCounter } from "~/metronome";
import { useMetronomeState } from "~/metronome_state";
import Bar from "../bars";

export const loader = async ({
  params,
  context,
}: LoaderFunctionArgs) => {
  invariant(params.id, "Missing id param");
  const db = context.cloudflare.env.DB
  const song = await getSong(db, params.id);
  if (!song) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ song });
};

export const action = async ({
  params,
  request,
  context,
}: ActionFunctionArgs) => {
  invariant(params.id, "Missing id param");
  const db = context.cloudflare.env.DB
  const formData = await request.formData();
  const action = formData.get('action');
  if (action === 'favorite') {
    const value = formData.get("favorite") === "true";
    return setFavorite(db, params.id, value);
  } else if (action === 'paste') {
    const data: string = formData.get('data')?.toString() as string;
    if (data === null || data === undefined) {
      return;
    }
    const song = JSON.parse(data);
    if (song === null || data == undefined) {
      return;
    }
    song['id'] = params.id;
    song['name'] = song['name'] + ' (Copy)';
    console.log('update song');
    return updateSong(db, params.id, song);
  } else {
    console.log('unknown action');
    return {};
  }
};

export default function Songs() {
  const { song } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const metronome = useMetronomeState(song);
  const [volume, setVolume] = useState(10);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // setVolume(Number(event.target.value));
    // metronome.setVolume(Number(event.target.value));
  };

  return (
    <div id="contact">
      <div>
        <h1>
          {song.name ? song.name : (<i>No Name</i>)}
          <Favorite song={song} />
        </h1>

        <p>{song.instrument}</p>

        <div>
          <Form action="edit">
            <button type="submit">Edit</button>
          </Form>
          <Form
            action="destroy"
            method="post"
            onSubmit={(event) => {
              const response = confirm(
                "Please confirm you want to delete this record."
              );
              if (!response) {
                event.preventDefault();
              }
            }}
          >
          <button type="submit">Delete</button>
          </Form>
          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(song, null, 2))}>
            Copy
          </button>
          <Form action="paste" method="post" onSubmit={(event) => {
            event.preventDefault();
            navigator.clipboard.readText().then((text) => {
              const formData = new FormData()
              formData.append('data', text);
              formData.append('action', 'paste');
              submit(formData, { method: 'post' });
            });
          }}>
            <button type="submit">Paste</button>
          </Form>
        </div>
        <div style={{ display: 'flex' }}>
          {
            !song.bars ? null : song.bars.map((value, index) => {
              const isActive = (metronome.bar?.id ?? 0) == value.id;
              const currentBar = Math.max(0, Math.floor((metronome.counter - metronome.totalCountUntilStartOfBar) / (metronome.numberOfBeats * metronome.numberOfSubBeats)));
              return <Bar
                key={index}
                bar={value}
                isActive={isActive}
                currentBar={currentBar}
                didSelectBar={(bar, barIndex) => {
                  metronome.setBar(bar, barIndex === -1 ? 0 : barIndex);
                }}
              />
            })
          }
        </div>
        <Outlet />
      </div>
      <div>
        <label htmlFor="volume">Volume: </label>
        <input
          type="range"
          id="volume"
          name="volume"
          min="0"
          max="20"
          value={volume}
          onChange={handleVolumeChange}
        />
      </div>
      <MetronomeCounter song={song} />
    </div>
  );
}

const Favorite: FunctionComponent<{
  song: Pick<SongRecord, "favorite">;
}> = ({ song }) => {
  const fetcher = useFetcher();
  const favorite = fetcher.formData
    ? fetcher.formData.get("favorite") === "true"
    : song.favorite;

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="action" value="favorite" />
      <button
        aria-label={
          favorite
            ? "Remove from favorites"
            : "Add to favorites"
        }
        name="favorite"
        value={favorite ? "false" : "true"}
      >
        {favorite ? "★" : "☆"}
      </button>
    </fetcher.Form>
  );
};
