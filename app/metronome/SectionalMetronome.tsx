import { MetronomeStateSnapshot, useMetronomeState } from "./useMetronomeState";
import { SongType } from "~/data/database";
import { Index } from "./controller";
import { MetronomeCounterInternal } from "./InternalMetronome";
import { Back, Beginning, End, Forward, Play } from "./controls";
import { Flex } from "@radix-ui/themes";

// https://coolors.co/091540-7692ff-abd2fa-3d518c-1b2cc1
// #091540
// #7692FF
// #ABD2FA
// #3D518C
// #1B2CC1
// #E0E0E2

const BeatsInBar = ({ isHighlightedBar, isHighlightedBeat, numberOfBeats } : { isHighlightedBar: boolean, isHighlightedBeat: number, numberOfBeats: number, }) => {
  const colorForBeat = (index: number) => {
    return isHighlightedBeat === index ? 'var(--accent-10)' : 'var(--gray-9)';
  }
  const firstVerticalLineStrokeColor = colorForBeat(0);
  const style = {
    gridRow: '2',
    gridColumn: '1',
    backgroundColor: 'var(--color-background)',
  };
  if (isHighlightedBar) {
    style['backgroundColor'] = 'var(--gray-4)';
  }

  return <svg viewBox="0 0 32 32" style={style}>
    <g stroke="none" strokeWidth="2" fill="none" fillRule="evenodd">
        {/* Vertical Line */}
        <line x1="1" y1="0" x2="1" y2="32" stroke={firstVerticalLineStrokeColor} />
        {/* Additional Lines */}
        {Array(numberOfBeats - 1).fill(1).map((value, index) => {
          const i = index + 1;
          const x = 1 + i * 8 * 4 / numberOfBeats;
          const stroke = colorForBeat(i);
          return <line key={i} stroke={stroke} x1={x} y1="16" x2={x} y2="32" />
        })}
    </g>
  </svg>
};

export const SectionalMetronomeBars = ({ state } : { state: MetronomeStateSnapshot } ) => {
  const setIndex = (event: React.MouseEvent<HTMLDivElement>, index: Index) => {
    event.stopPropagation();
    state.setIndex(index);
  };

  const bars: React.ReactNode[] = [];

    let barNumber = 1;
    let index = state.controller.firstIndex();
    while (index.counter != -1) {
      const section = state.controller.sectionAtIndex(index);
      const sectionActiveIndicator = state.index.isSameBar(index) ? '⬤' : '';
      const isSameBar = state.index.isSameBar(index);
      const i = index; // javascript copies references to variables, not the actual value.
      const sectionName = section.name.length > 0 ? section.name : `${section.id + 1}`;
      bars.push(
        <div key={index.counter} className="bar" onClick={event => setIndex(event, i)}>
              {index.bar === 0 ? <p style={{gridRow: '1', gridColumn: '1'}}>{sectionName}</p> : null}
              {/* Fancy vertical bars in timeline */}
              <BeatsInBar isHighlightedBar={isSameBar} isHighlightedBeat={isSameBar ? state.index.beat : -1} numberOfBeats={section.numberOfBeats} />
              {/* State indicators below timeline. */}
              <p style={{gridRow: '3', gridColumn: '1'}}>{barNumber} <span style={{color:'var(--accent-indicator)'}}>{sectionActiveIndicator}</span></p>
        </div>
      )
      barNumber += 1;
      index = state.controller.nextBarIndex(index);
    }
    return <div className="grid-container">{ bars }</div>;
}

export const PlayPauseControls = ({ state }: { state: MetronomeStateSnapshot }) => {
  return <Flex justify='center' gap='2'>
    <Beginning onClick={() => {
      state.setIndex(state.controller.previousSection());
    }} />
    <Back onClick={() => {
      console.log('back');
      state.setIndex(state.controller.previousBar());
    }} />
    <Play isPlaying={state.isPlaying ?? false} onClick={() => state.toggleIsPlaying()} />
    <Forward onClick={() => {
      state.setIndex(state.controller.nextBarIndex(state.controller.currentIndex));
    }} />
    <End onClick={() => {
      state.setIndex(state.controller.nextSection());
    }} />
  </Flex>
}

export const SectionalMetronome = ({ song }: { song: SongType }) => {
  const state = useMetronomeState(song);
  return <>
    <MetronomeCounterInternal state={state} />
    <SectionalMetronomeBars state={state} />
    <PlayPauseControls state={state} />
  </>
}
