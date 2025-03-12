import { useMetronomeState } from "./useMetronomeState";
import { SongType } from "../data";
import { Index } from "./controller";
import { MetronomeCounterInternal } from "./InternalMetronome";
import { Back, Beginning, End, Forward, Play } from "./controls";

// https://coolors.co/091540-7692ff-abd2fa-3d518c-1b2cc1
// #091540
// #7692FF
// #ABD2FA
// #3D518C
// #1B2CC1
// #E0E0E2

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

export const SectionalMetronome = ({ song }: { song: SongType }) => {

  const state = useMetronomeState(song);

  const handleClick = () => {
    state.toggleIsPlaying();
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
    <div style={{ display: 'flex', justifyContent: 'center', margin: '2em' }}>
      <Beginning onClick={() => { 
        state.setIndex(state.controller.previousSection());
      }}/>
      <Back onClick={() => {
        console.log('back');
        // state.setIndex(state.controller.)
        state.setIndex(state.controller.previousBar());
      }}/>
      <Play isPlaying={state.isPlaying ?? false} onClick={handleClick}/>
      <Forward onClick={() => {
        state.setIndex(state.controller.nextBarIndex(state.controller.currentIndex));
      }} />
      <End onClick={() => {
        state.setIndex(state.controller.nextSection());
      }}/>
    </div>
  </>
}
