import { Beginning, Back, Play, Forward, End } from "./controls";
import { Index, Section } from "./controller";
import React, { useEffect, createRef, KeyboardEvent } from "react";

interface MetronomeCounterInternalProps {
  startStopEvent: () => void
  index: Index
  section: Section | null
  isPlaying: boolean | null
  isLoaded: boolean
  children?: React.ReactNode
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