import { json } from "@remix-run/cloudflare";
import { Form, useLoaderData, useFetcher, useSubmit, Outlet, Link } from "@remix-run/react";
import { useEffect, useLayoutEffect, useState, type FunctionComponent } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import invariant from "tiny-invariant";
import { getSong, setFavorite, updateSong } from "../data";
import type { SectionType, SongType } from "../data";
import { SectionalMetronome } from "~/metronome/views";
import { useMetronomeState } from "~/metronome/useMetronomeState";
import { PlusMinusControl } from '~/metronome/controls';
import { Settings } from '../metronome/controls';
import { Index, Section, Song } from "~/metronome/controller";

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
    return updateSong(db, params.id, song);
  } else if (action === 'save') {
    const data: string = formData.get('data')?.toString() as string;
    if (data === null || data === undefined) {
      return;
    }
    const song = JSON.parse(data);
    if (song === null || data == undefined) {
      return;
    }
    song['id'] = params.id;
    return updateSong(db, params.id, song);
  } else {
    console.log('unknown action');
    return {};
  }
};

export default function Songs() {
  const { song } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const state = useMetronomeState(song);
  const [isDirty, setIsDirty] = useState(false);
  const [volume, setVolume] = useState(10);

  useEffect(() => {
    // This still doesn't quite cut it, since we need to refresh the data from the server,
    // since the client side data has been... shock, horror, gasp ...modified.
    setIsDirty(false);
  }, [song.id]);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(event.target.value));
    state.setVolume(Number(event.target.value));
  };

  return (
    <div id="contact">
      <div>
        <h1>
          {song.name ? song.name : (<i>No Name</i>)}
          <Favorite song={song} />
        </h1>

        <p>{song.instrument}</p>

        {/* <Settings onClick={() => console.log('Settings')}/> */}

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
      <SectionalMetronome song={song}  />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', margin: '2em' }}>
        <div></div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1em' }}>
          <PlusMinusControl
            name="Sub-beat" 
            onIncrease={() => {
              if (!state.index.isNotAnIndex()) {
                const section = song.sections[state.index.section];
                // is this modifying the loader data?
                section.numberOfSubBeats += 1;
                state.metronome?.setSongWithIndex(song, state.controller.currentIndex);
                setIsDirty(true);
              }
            }}
            onDecrease={() => {
              if (!state.index.isNotAnIndex()) {
                const section = song.sections[state.index.section];
                if (section.numberOfSubBeats > 0) {
                  section.numberOfSubBeats -= 1;
                  state.metronome?.setSongWithIndex(song, state.controller.currentIndex);
                  setIsDirty(true);
                }
              }
            }}
          />
          <PlusMinusControl
            name="Beat" 
            onIncrease={() => {
              if (!state.index.isNotAnIndex()) {
                const section = song.sections[state.index.section];
                section.numberOfBeats += 1;
                state.metronome?.setSongWithIndex(song, state.controller.currentIndex);
                setIsDirty(true);
              }
            }}
            onDecrease={() => {
              if (!state.index.isNotAnIndex()) {
                const section = song.sections[state.index.section];
                if (section.numberOfBeats > 1) {
                  section.numberOfBeats -= 1;
                  state.metronome?.setSongWithIndex(song, state.controller.currentIndex);
                  setIsDirty(true);
                }
              }
            }}
          />
          <PlusMinusControl
            name="Bar" 
            onIncrease={() => {
              if (!state.index.isNotAnIndex()) {
                const section = song.sections[state.index.section];
                section.numberOfBars += 1;
                state.metronome?.setSongWithIndex(song, state.controller.currentIndex);
                setIsDirty(true);
              }
            }}
            onDecrease={() => {
              if (!state.index.isNotAnIndex()) {
                const section = song.sections[state.index.section];
                if (section.numberOfBars > 1) {
                  section.numberOfBars -= 1;
                  state.metronome?.setSongWithIndex(song, state.controller.currentIndex);
                  setIsDirty(true);
                }
              }
            }}
          />
          <PlusMinusControl
            name="Section" 
            onIncrease={() => {
              if (!state.index.isNotAnIndex()) {
                const section: SectionType = {
                  id: state.index.section,
                  name: `Section ${state.index.section}`,
                  bpm: 120,
                  numberOfBeats: 4,
                  numberOfSubBeats: 4,
                  delay: 0,
                  numberOfBars: 4
                }
                const temporarySong = new Song(song);
                const index = temporarySong.indexAtCoordinates(state.index.section + 1, 0, 0, 0);
                song.sections.splice(state.index.section + 1, 0, section)
                state.metronome?.setSongWithIndex(song, index);
                setIsDirty(true);
              }
            }}
            onDecrease={() => {
              if (!state.index.isNotAnIndex()) {
                if (song.sections.length > 1) {
                  song.sections.splice(state.index.section, 1);
                  const temporarySong = new Song(song);
                  const index = temporarySong.indexAtCoordinates(Math.max(state.index.section + -1, 0), 0, 0, 0);
                  state.metronome?.setSongWithIndex(song, index);
                  setIsDirty(true);
                }
              }
            }}
          />
        </div>
        <div style={{margin: '1em'}}>
          <Form style={{ visibility: isDirty ? 'visible' : 'hidden' }} action="save" method="post" onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData();
            const textData = JSON.stringify(song, null, 2)
            formData.append('data', textData);
            formData.append('action', 'save');
            submit(formData, { method: 'post' });
          }}>
            <button type="submit">Save</button>
          </Form>
        </div>
      </div>
    </div>
  );
}

const Favorite: FunctionComponent<{
  song: Pick<SongType, "favorite">;
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