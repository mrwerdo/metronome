import React, { useState, useRef, useEffect, createRef, KeyboardEvent } from "react";
import { MetronomeState, useMetronomeState } from "./metronome_state";
import { BarType, SongType } from "./data";
import { Beginning, Back, Play, Forward, End } from "./controls";

// https://coolors.co/091540-7692ff-abd2fa-3d518c-1b2cc1
// #091540
// #7692FF
// #ABD2FA
// #3D518C
// #1B2CC1

export const MetronomeStandalone = () => {
  const [counter, setCounter] = useState(0);
  const [isLoaded, setLoaded] = useState(false);
  const [volume, setVolume] = useState(10);
  const state = useRef<MetronomeState | null>(null)
  useEffect(() => {
    const song: SongType = {
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

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(event.target.value));
    state.current?.setVolume(Number(event.target.value));
  };

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
  </>
}

export function HydrateFallback() {
  return <p>Loading Metronome...</p>
}


const BeatsInBar = ({ style } : { style?: React.CSSProperties}) => (
  <svg viewBox="0 0 32 32" style={style}>
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g stroke="#416788" strokeWidth="2">
        <g>
          {/*  */}
          <line x1="1" y1="0" x2="1" y2="32" />
          <line x1="9" y1="16" x2="9" y2="32" />
          <line x1="17" y1="16" x2="17" y2="32" />
          <line x1="25" y1="16" x2="25" y2="32" />
          <line x1="0" y1="16.5" x2="32" y2="16.5" />
        </g>
      </g>
    </g>
  </svg>
);

export const MetronomeCounter = ({ song, selectBar }: { song: SongType, selectBar: (bar: BarType, index: number) => void }) => {

  const state = useMetronomeState(song);

  const handleClick = () => {
    state.toggleIsPlaying();
  }

  const bars: React.ReactNode[] = [];

  if (song.bars) {
    let index = -1;
    for (let bar of song.bars) {
      index += 1;
      const isActive = (state.bar?.id ?? 0) == bar.id;
      const currentBar = Math.max(0, Math.floor((state.counter - state.totalCountUntilStartOfBar) / (state.numberOfBeats * state.numberOfSubBeats)));
      const value = isActive ? '⬤' :'⭘';

      for (let i = 0; i < bar.numberOfBars; i++) {
        bars.push(
          <div
            key={`${index}-${i}`}
            className="bar"
            onClick={(event) => {
              event.stopPropagation();
              selectBar(bar, i+1)
            }}
          >
            {i === 0 ? <p style={{gridRow: '1', gridColumn: '1'}}>{bar.name}</p> : null}
            <BeatsInBar style={{
              gridRow: '2', gridColumn: '1',
              backgroundColor: (isActive && i === currentBar) ? 'lightgray' : '',
              }}/>
            <p style={{gridRow: '3', gridColumn: '1'}}>{index}-{i} {value}</p>
          </div>
        )
      }
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
    >
      <div className="grid-container">
        <div className="bar">
          <p className='before'>B</p>
        </div>
        { bars }
        <div className="bar">
          <p className='after'>E</p>
        </div>
      </div>
    </MetronomeCounterInternal>
  </>
}


// Was sure whether css was affecting performance, most likely it was my code not using the counter correctly.
function calculateStyles(numberOfBeats: number, numberOfSubBeats: number, counter: number, index: number): object {
  let className = 'metronome_bar_counter';
  let backgroundColor = '#416788';
  const offset = index % numberOfSubBeats;
  const beat = (index - offset) / numberOfSubBeats;


  if (offset === 0) {
    className += ' metronome_bar_counter_beat';
    backgroundColor = '#7389AE';
  } else {
    className += ' metronome_bar_counter_subbeat';
    backgroundColor = '#416788';
  }
  
  if ((counter ?? 0) % (numberOfBeats * numberOfSubBeats) === index) {
    className += ' metronome_bar_counter_current';
    backgroundColor = '#81D2C7';
  }

  const styles = {
    padding: '5px',
    textAlign: 'center',
    fontWeight: className.includes('metronome_bar_counter_current') ? 'bold' : 'normal',
    width: '20px',
    alignContent: 'end',
    height: className.includes('metronome_bar_counter_beat') ? '100px' : '30px',
    backgroundColor: backgroundColor,
    borderRadius: '2px'
  };

  return styles;
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
  children?: React.ReactNode
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
        <div>
          <p>Counter: {props.counter}, Normalized Counter: {subbeat}</p>
          <p style={{ fontSize: 100, textAlign: "center", margin: 0 }}>{(currentBeat % numberOfBeats) + 1}.<span style={{ fontSize: 50 }}>{subbeat + 1}</span></p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateRows: '1fr',
          gridTemplateColumns: `repeat(${numberOfBeats * numberOfSubBeats}, 28px)`,
          gridAutoFlow: 'column',
          alignItems: 'end',
          justifyContent: 'center',
          marginBottom: '2em'
        }}>
          {
            Array(numberOfBeats * numberOfSubBeats).fill(1).map((value, index) => {
              const offset = index % numberOfSubBeats;
              const beat = (index - offset) / numberOfSubBeats;
              return <span style={calculateStyles(numberOfBeats, numberOfSubBeats, currentBeat * numberOfSubBeats + subbeat, index)} key={index}>{offset === 0 ? (beat+1).toString() : ''}</span>
            })
          }
        </div>
        { props.children }
        <div style={{ display: 'flex', justifyContent: 'center', margin: '2em' }}>
          <Beginning onClick={() => console.log('beginning')}/>
          <Back onClick={() => console.log('back')}/>
          <Play onClick={props.startStopEvent}/>
          <Forward onClick={() => console.log('forward')} />
          <End onClick={() => console.log('end')}/>
        </div>
      </div>
    </>
  );
};