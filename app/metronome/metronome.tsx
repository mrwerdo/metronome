import React, { useState, useRef, useEffect, createRef, KeyboardEvent } from "react";
import { MetronomeState, useMetronomeState } from "./metronome_state";
import { SectionType, SongType } from "../data";
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
      sections: [
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

const BeatsInBar = ({ style, numberOfBeats, highlightedBeat } : { style?: React.CSSProperties, numberOfBeats: number, highlightedBeat: number }) => {
  const firstVerticalLineStrokeColor = highlightedBeat === 0 ? '#81D2C7' : '#416788';
  return <svg viewBox="0 0 32 32" style={style}>
    <g stroke="none" strokeWidth="2" fill="none" fillRule="evenodd">
        {/* Vertical Line */}
        <line x1="1" y1="0" x2="1" y2="32" stroke={firstVerticalLineStrokeColor} />
        {/* Center Horizontal Line */}
        <line x1="0" y1="16.5" x2="32" y2="16.5" />
        {/* Additional Lines */}
        {Array(numberOfBeats - 1).fill(1).map((value, index) => {
          const i = index + 1;
          const x = 1 + i * 8 * 4 / numberOfBeats;
          const stroke = (highlightedBeat) === i ? '#81D2C7' : '#416788';
          return <line key={i} stroke={stroke} x1={x} y1="16" x2={x} y2="32" />
        })}
    </g>
  </svg>
};

export const MetronomeCounter = ({ song }: { song: SongType }) => {

  const state = useMetronomeState(song);

  const handleClick = () => {
    state.toggleIsPlaying();
  }

  const selectBar = (bar: SectionType, barIndex: number) => {
    state.setBar(bar, barIndex === -1 ? 0 : barIndex);
  }

  const bars: React.ReactNode[] = [];

  if (song.sections) {
    let index = -1;
    let barId = 0;
    for (let bar of song.sections) {
      index += 1;
      const isActive = (state.bar?.id ?? 0) == bar.id;
      const currentBar = Math.max(0, Math.floor((state.counter - state.totalCountUntilStartOfBar) / (state.numberOfBeats * state.numberOfSubBeats)));

      for (let i = 0; i < bar.numberOfBars; i++) {
        const isActiveBarInBar = isActive && i === currentBar;
        const value = isActiveBarInBar ? '⬤' :'⭘';
        const style = {
          gridRow: '2',
          gridColumn: '1',
          backgroundColor: 'white',
        };
        if (isActiveBarInBar) {
          style['backgroundColor'] = 'lightgray';
        }
        barId += 1;
        bars.push(
          <div
            key={`${index}-${i}`}
            className="bar"
            onClick={(event) => {
              event.stopPropagation();
              selectBar(bar, i+1)
            }}
          >
            {/* Section name above timeline. */}
            {i === 0 ? <p style={{gridRow: '1', gridColumn: '1'}}>{bar.name}</p> : null}
            {/* Fancy vertical bars in timeline */}
            <BeatsInBar style={style}
              numberOfBeats={bar.timeSignature}
              highlightedBeat={isActiveBarInBar ? state.currentBeat : -1}
              />
              {/* State indicators below timeline. */}
            <p style={{gridRow: '3', gridColumn: '1'}}>{barId} {value}</p>
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
        <div className="bar"
          onClick={(event) => {
            event.stopPropagation();
            state.setBar(song.sections[0], 0);
          }}
        >
          <p style={{gridRow: '1', gridColumn: '1'}}>Above</p>
          <p className="before" style={{gridRow: '2', gridColumn: '1'}}>B</p>
          <p style={{gridRow: '3', gridColumn: '1'}}>Below</p>
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
        {/* make these stay at the bottom of the page, everything above should scroll */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '2em' }}>
          <Beginning onClick={() => console.log('beginning')}/>
          <Back onClick={() => console.log('back')}/>
          <Play isPlaying={isPlaying} onClick={props.startStopEvent}/>
          <Forward onClick={() => console.log('forward')} />
          <End onClick={() => console.log('end')}/>
        </div>
      </div>
    </>
  );
};