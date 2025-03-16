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

const BeatsAndSubBeatsVisualizer = ({numberOfBeats, numberOfSubBeats, currentIndex } : { numberOfBeats: number, numberOfSubBeats: number, currentIndex: Index}) => {
  const elements: React.ReactNode[] = [];
  for (let beat = 0; beat < numberOfBeats; beat += 1) {
    for (let subBeat = 0; subBeat < numberOfSubBeats; subBeat += 1) {
      const key = beat * numberOfSubBeats + subBeat;
      const isCurrentBeatAndSubBeat = (currentIndex.beat === beat && currentIndex.subBeat === subBeat);
      const isFirstBeat = subBeat == 0;
      const styles: React.CSSProperties = {
        padding: '5px',
        textAlign: 'center',
        fontWeight: isCurrentBeatAndSubBeat ? 'bold' : 'normal',
        width: '20px',
        alignContent: 'end',
        height: isFirstBeat ? '100px' : '30px',
        backgroundColor: isCurrentBeatAndSubBeat ? 'var(--accent-indicator)' : (isFirstBeat ? 'var(--gray-9)' : 'var(--gray-5)'),
        borderRadius: '2px',
      };
      let element = <span style={styles} key={key}>
        { isFirstBeat ? (beat + 1).toString() : '' }
      </span>
      elements.push(element);
    }
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
          <BeatsAndSubBeatsVisualizer numberOfBeats={numberOfBeats} numberOfSubBeats={numberOfSubBeats} currentIndex={index} />
        </div>
        { children }
      </div>
    </>
  );
};