import React, { useEffect, createRef, KeyboardEvent } from "react";
import { useMetronomeState } from "./useMetronomeState";
import { SongType } from "../data";
import { Beginning, Back, Play, Forward, End } from "./controls";
import { Index, Section } from "./controller";
import * as Tone from "tone";

// https://coolors.co/091540-7692ff-abd2fa-3d518c-1b2cc1
// #091540
// #7692FF
// #ABD2FA
// #3D518C
// #1B2CC1
const veryLongSong: SongType = {
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
        numberOfSubBeats: 1,
        numberOfBeats: 4
      }
    ]
  }

export const MetronomeStandalone = () => {
  const state = useMetronomeState(veryLongSong);
  const handleClick = () => {
    Tone.start().then(() => {
      state.toggleIsPlaying();
    });
  }

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    state.setVolume(Number(event.target.value));
  };

  const section = state.controller.sectionAtIndex(state.index) ?? null;

  return <>
    <MetronomeCounterInternal
      startStopEvent={handleClick}
      section={section}
      index={state.index}
      isLoaded={state.isLoaded}
      isPlaying={state.isPlaying ?? null}
    />
    <div>
      <label htmlFor="volume">Volume: </label>
      <input
        type="range"
        id="volume"
        name="volume"
        min="0"
        max="20"
        onChange={handleVolumeChange}
      />
    </div>
  </>
}

export function HydrateFallback() {
  return <p>Loading Metronome...</p>
}

const BeatsInBar = ({ isHighlightedBar, isHighlightedBeat, numberOfBeats } : { isHighlightedBar: boolean, isHighlightedBeat: number, numberOfBeats: number, }) => {
  const firstVerticalLineStrokeColor = isHighlightedBeat === 0 ? '#81D2C7' : '#416788';
  const style = {
    gridRow: '2',
    gridColumn: '1',
    backgroundColor: 'white',
  };
  if (isHighlightedBar) {
    style['backgroundColor'] = 'lightgray';
  }
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
          const stroke = (isHighlightedBeat) === i ? '#81D2C7' : '#416788';
          return <line key={i} stroke={stroke} x1={x} y1="16" x2={x} y2="32" />
        })}
    </g>
  </svg>
};

export const MetronomeCounter = ({ song }: { song: SongType }) => {

  const state = useMetronomeState(song);

  const handleClick = () => {
    Tone.start().then(() => {
      state.toggleIsPlaying();
    });
  }

  const setIndex = (event: React.MouseEvent<HTMLDivElement>, index: Index) => {
    event.stopPropagation();
    state.setIndex(index);
  };

  const bars: React.ReactNode[] = [];

  let barNumber = 1;
  let index = state.controller.firstIndex();
  while (index.counter != -1) {
    const section = state.controller.sectionAtIndex(index);
    const sectionActiveIndicator = state.index.isSameBar(index) ? '⬤' : '⭘';
    const isSameBar = state.index.isSameBar(index);
    const i = index; // javascript copies references to variables, not the actual value.
    bars.push(
      <div key={index.counter} className="bar" onClick={event => setIndex(event, i)}>
            {index.bar === 0 ? <p style={{gridRow: '1', gridColumn: '1'}}>{section.name}</p> : null}
            {/* Fancy vertical bars in timeline */}
            <BeatsInBar isHighlightedBar={isSameBar} isHighlightedBeat={isSameBar ? state.index.beat : -1} numberOfBeats={section.numberOfBeats} />
            {/* State indicators below timeline. */}
            <p style={{gridRow: '3', gridColumn: '1'}}>{barNumber} {sectionActiveIndicator}</p>
      </div>
    )
    barNumber += 1;
    index = state.controller.nextBarIndex(index);
  }

  const currentSection = state.controller.sectionAtIndex(state.index) ?? null;

  return <>
    <MetronomeCounterInternal
      startStopEvent={handleClick}
      index={state.index}
      isLoaded={state.isLoaded}
      section={currentSection}
      isPlaying={state.isPlaying ?? null}
    >
      <div className="grid-container">
        <div className="bar"
          onClick={(event) => {
            event.stopPropagation();
            state.setIndex(state.controller.firstIndex());
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

const BeatsAndSubBeatsVisualizer = ({numberOfBeats, numberOfSubBeats, index} : { numberOfBeats: number, numberOfSubBeats: number, index: Index}) => {
  const elements: React.ReactNode[] = [];
  for (let i = 0; i < numberOfBeats * numberOfSubBeats; i += 1) {
    let element = <span style={calculateStyles(numberOfBeats, numberOfSubBeats, index.beat * numberOfSubBeats + index.subBeat, i)} key={i}>
      {i+1}
    </span>
    elements.push(element);
  }
  return <>
  {elements}
  </>;
}


interface MetronomeCounterInternalProps {
  startStopEvent: () => void
  index: Index
  section: Section | null
  isPlaying: boolean | null
  isLoaded: boolean
  children?: React.ReactNode
}

export const MetronomeCounterInternal = ({ index, section, isPlaying, children, startStopEvent } : MetronomeCounterInternalProps) => {
  const div = createRef<HTMLDivElement>();

  useEffect(() => {
    div.current?.focus();
  }, []);

  const keypress = (event: KeyboardEvent) => {
    if (event.key === ' ') {
      event.preventDefault();
      startStopEvent();
    }
  }

  const numberOfBeats = section?.numberOfBeats ?? 0;
  const numberOfSubBeats = section?.numberOfSubBeats ?? 0;

  return (
    <>
      <div ref={div} tabIndex={0} onKeyDown={keypress}>
        <div>
          <p>Counter: {index.counter}, Normalized Counter: {index.subBeat}</p>
          <p style={{ fontSize: 100, textAlign: "center", margin: 0 }}>{(index.beat) + 1}.<span style={{ fontSize: 50 }}>{index.subBeat + 1}</span></p>
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
          <BeatsAndSubBeatsVisualizer numberOfBeats={numberOfBeats} numberOfSubBeats={numberOfSubBeats} index={index} />
        </div>
        { children }
        {/* make these stay at the bottom of the page, everything above should scroll */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '2em' }}>
          <Beginning onClick={() => console.log('beginning')}/>
          <Back onClick={() => console.log('back')}/>
          <Play isPlaying={isPlaying ?? false} onClick={startStopEvent}/>
          <Forward onClick={() => console.log('forward')} />
          <End onClick={() => console.log('end')}/>
        </div>
      </div>
    </>
  );
};