import { json } from "@remix-run/cloudflare";
import { Form, useLoaderData, useFetcher, useSubmit, Outlet, Link } from "@remix-run/react";
import React, { DetailedHTMLProps, HTMLAttributes, useEffect, useLayoutEffect, useRef, useState, type FunctionComponent } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import invariant from "tiny-invariant";
import { getSong, setFavorite, updateSong } from "../data";
import type { SectionType, SongType } from "../data";
import { SectionalMetronome } from "~/metronome/views";
import { MetronomeStateSnapshot, useMetronomeState } from "~/metronome/useMetronomeState";
import { Faster, PlusMinusControl, Slower } from '~/metronome/controls';
import { Settings } from '../metronome/controls';
import { Index, Section, Song } from "~/metronome/controller";
import { tempoGivenBpm } from "~/metronome/bpm";

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

const TempoControl = ({ state, song, setIsDirty } : { state:  MetronomeStateSnapshot, song: SongType, setIsDirty: (dirty: boolean) => void }) => {
  if (state.index.isNotAnIndex()) {
    return <></>
  }

  const section = song.sections[state.index.section];
  const tempo = tempoGivenBpm(section.bpm);

  const setTempo = (tempo_t: number) => {
    section.bpm = tempo_t;
    if (section.name == tempo.name) {
      section.name = tempoGivenBpm(tempo_t).name;
    }
    state.metronome?.setSongWithIndex(song, state.index);
    setIsDirty(true);
  };

  const tempos: number[] = [
    10, 20, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60,
    63, 66, 69, 72, 76, 80, 84, 92, 96, 100, 104, 108, 112,
    126, 130, 132, 144, 152, 160, 168, 176, 184, 192, 200,
    208, 215, 225, 240, 250, 275, 300
  ];

  const faster = () => {
    for (let i = 0; i < tempos.length; i += 1) {
      if (tempos[i] > section.bpm) {
        setTempo(tempos[i]);
        break;
      }
    }
  };
  
  const slower = () => {
    for (let i = tempos.length - 1; i >= 0; i -= 1) {
      if (tempos[i] < section.bpm) {
        setTempo(tempos[i]);
        break;
      }
    }
  };

  const currentTempoElement = useRef<HTMLParagraphElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentTempoElement.current && containerRef.current) {
      const container = containerRef.current;
      const element = currentTempoElement.current;
  
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
  
      // Calculate the center position
      const scrollLeft = container.scrollLeft + 
        (elementRect.left - containerRect.left) - 
        (containerRect.width / 2) + (elementRect.width / 2);
  
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [section.bpm]);

  const tempoButtons: React.ReactNode[] = [];
  for (let tempo of tempos) {
    if (tempo === section.bpm) {
      tempoButtons.push(
        <p key={tempo} ref={currentTempoElement} style={{fontWeight: 'bold', fontSize: '110%'}} onClick={() => { setTempo(tempo); }}>{tempo}</p>
      );
    } else {
      tempoButtons.push(
        <p key={tempo} onClick={() => { setTempo(tempo); }}>{tempo}</p>
      );
    }
  }

  return <div>
    <div ref={containerRef} style={{ width: '28em', overflowX: 'scroll', whiteSpace: 'nowrap', scrollbarWidth: 'none'}}>
      <div style={{display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(2em, 1fr)', gap: '10px', alignItems: 'baseline'}}>
        { tempoButtons }
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 4fr 1fr', alignItems: 'center', justifyItems: 'center', marginBottom: '1em' }}>
      <Slower onClick={slower} />
      <p>{tempo.name}</p>
      <Faster onClick={faster} />
    </div>
  </div>
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

  const currentSectionName = state.index.isNotAnIndex() ? '' : song.sections[state.index.section].name;

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', justifyItems: 'center', margin: '2em' }}>
        <div>
        </div>
        <TempoControl state={state} song={song} setIsDirty={setIsDirty} />
        <div></div>
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
        <div></div>
        <div style={{marginTop: '2em', marginBottom: '2em'}}>
          <label htmlFor="sectionName">Rename</label>
          <input id="sectionName" name="sectionName" type="text" value={currentSectionName} onChange={(event) => {
            const text = event.target.value;
            if (state.index.isNotAnIndex()) {
              return;
            }
            song.sections[state.index.section].name = text;
            state.metronome?.setSongWithIndex(song, state.controller.currentIndex);
            setIsDirty(true);
          }}></input>
        </div>
        <div></div>
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