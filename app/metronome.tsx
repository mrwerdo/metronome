import { useState, useRef, useEffect, createRef, KeyboardEvent, useSyncExternalStore } from "react";
import { MetronomeState, MetronomeStateSnapshot } from "./metronome_state";
import { SongRecord } from "./data";

// https://coolors.co/091540-7692ff-abd2fa-3d518c-1b2cc1
// #091540
// #7692FF
// #ABD2FA
// #3D518C
// #1B2CC1

export const MetronomeStandalone = () => {
  const [counter, setCounter] = useState(0);
  const [isLoaded, setLoaded] = useState(false);
  const state = useRef<MetronomeState | null>(null)
  useEffect(() => {
    const song: SongRecord = {
      id: '0',
      createdAt: '2024-08-20 16:06:00T1000',
      favorite: false,
      instrument: 'unknown',
      name: 'Hidden',
      bars: [
        {
          id: 0,
          bpm: 120,
          delay: 0,
          name: 'Hidden',
          numberOfBars: 9999,
          subBeats: 1,
          timeSignature: 4
        }
      ]
    }
    state.current = new MetronomeState(song, 4, 3, setCounter, setLoaded);
    return () => {
      state.current?.stop()
    }
  }, [])
  const handleClick = () => {
    state.current?.toggleIsPlaying();
  }

  return <>
    <MetronomeCounterInternal
      startStopEvent={handleClick}
      counter={state.current?.counter ?? 0}
      isLoaded={isLoaded}
      numberOfBeats={state.current?.numberOfBeats ?? null}
      numberOfSubBeats={state.current?.numberOfSubBeats ?? null}
      currentBeat={state.current?.currentBeat ?? null}
      currentSubBeat={state.current?.currentSubBeat ?? null}
      isPlaying={state.current?.isPlaying ?? null}
    />
  </>
}

let externalMetronomeState: MetronomeState | null;

export function HydrateFallback() {
  return <p>Loading Metronome...</p>
}

function subscribe(): ((callback: () => void) => (() => void)) {
  let isServerSideRendered = false;
  try {
    if (externalMetronomeState === null || externalMetronomeState === undefined) {
      externalMetronomeState = new MetronomeState(null, 4, 3, null, null);
      isServerSideRendered = true;
      return externalMetronomeState.subscribe.bind(externalMetronomeState);
    } else {
      return externalMetronomeState.subscribe.bind(externalMetronomeState);
    }
  } catch (error) {
    console.log('Assuming server side rendering.');
    externalMetronomeState = null;
    isServerSideRendered = false;
    return (callback: () => void) => {
      return () => {
        // cleanup is not necessary
      };
    };
  }
}

const getSnapshotServerResult = {
  counter: 0,
  numberOfBeats: 4,
  numberOfSubBeats: 3,
  currentBeat: 0,
  currentSubBeat: 0,
  isPlaying: false,
  isLoaded: false
};

function getSnapshot(): () => MetronomeStateSnapshot {
  if (externalMetronomeState !== null) {
    return externalMetronomeState.snapshot.bind(externalMetronomeState);
  } else {
    return () => {
      return getSnapshotServerResult;
    };
  }
}

export const MetronomeCounter = ({ song }: { song: SongRecord }) => {

  // This feels wierd?
  if (externalMetronomeState !== null && externalMetronomeState !== undefined) {
    externalMetronomeState.setSong(song);
  }

  const state = useSyncExternalStore<MetronomeStateSnapshot>(subscribe(), getSnapshot(), getSnapshot())

  const handleClick = () => {
    if (externalMetronomeState !== null) {
      externalMetronomeState.toggleIsPlaying();
    }
  }

  return <>
    <MetronomeCounterInternal
      startStopEvent={handleClick}
      counter={state.counter ?? 0}
      isLoaded={state.isLoaded}
      numberOfBeats={state.numberOfBeats ?? null}
      numberOfSubBeats={state.numberOfSubBeats ?? null}
      currentBeat={state.currentBeat ?? null}
      currentSubBeat={state.currentSubBeat ?? null}
      isPlaying={state.isPlaying ?? null}
    />
  </>
}

interface MetronomeCounterInternalProps {
  startStopEvent: () => void
  counter: number | null
  isLoaded: boolean
  numberOfBeats: number | null
  numberOfSubBeats: number | null
  currentBeat: number | null
  currentSubBeat: number | null
  isPlaying: boolean | null
}

function MetronomeCounterInternal(props: MetronomeCounterInternalProps) {
  const numberOfBeats = props.numberOfBeats ?? 0
  const numberOfSubBeats = props.numberOfSubBeats ?? 0
  const div = createRef<HTMLDivElement>();

  useEffect(() => {
    div.current?.focus();
  }, []);

  const keypress = (event: KeyboardEvent) => {
    if (event.key === ' ') {
      event.preventDefault();
      props.startStopEvent();
    }
  }

  const isPlaying = props.isPlaying ?? false;

  const currentBeat = props.currentBeat ?? 0;
  const subbeat = props.currentSubBeat ?? 0;

  return (
    <>
      <div ref={div} tabIndex={0} onKeyDown={keypress}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <p style={{ fontSize: 50 }}>{(currentBeat % numberOfBeats) + 1}.<span style={{ fontSize: 30 }}>{subbeat + 1}</span></p>
          <p style={{ fontSize: 15, marginLeft: 'auto' }}>Counter: {props.counter}</p>
          <p style={{ fontSize: 15, marginLeft: '1em' }}>Normalized Counter: {subbeat}</p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateRows: '1fr',
          gridTemplateColumns: `repeat(${numberOfBeats}, 1fr)`,
          gridAutoFlow: 'column'
        }}>
          {
            Array(numberOfBeats).fill(1).map((value, index) => {
              return <span key={index} style={{
                padding: '5px',
                textAlign: 'center',
                fontWeight: currentBeat === index ? 'bold' : 'normal',
                backgroundColor: currentBeat === index ? '#7692FF' : '#ABD2FA',
              }}>{index + 1}</span>
            })
          }
        </div>
        <div style={{
          display: 'grid',
          gridTemplateRows: '1fr',
          gridTemplateColumns: `repeat(${numberOfSubBeats}, 1fr)`,
          gridAutoFlow: 'column'
        }}>
          {
            Array(numberOfSubBeats).fill(1).map((value, index) => {
              return <span key={index} style={{
                padding: '5px',
                textAlign: 'center',
                fontWeight: subbeat === index ? 'bold' : 'normal',
                backgroundColor: subbeat === index ? '#7692FF' : '#ABD2FA',
              }}>{index + 1}</span>
            })
          }
        </div>
        <div>
          {/*
            No idea why this happens, but without suppressHydrationWarning, Firefox and Chrome 
            throw an error-warning which says that the server sent disabled="" and the client calculated
            disabled=true, but only after a second reload of the url. Is it due to client side state?
            Or is it due to the server sending disabled=""?
          */}
          <button onClick={props.startStopEvent} suppressHydrationWarning>
            {isPlaying ? "Stop" : "Play"}
          </button>
        </div>
      </div>
    </>
  );
};