import { SongType } from "~/data/database";
import { Play } from "./controls";
import { MetronomeCounterInternal } from "./InternalMetronome";
import { useMetronomeState } from "./useMetronomeState";

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

export const StandaloneMetronome = () => {
  const state = useMetronomeState(veryLongSong);
  const handleClick = () => {
    state.toggleIsPlaying();
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
    <div style={{display: 'flex', justifyContent: 'center'}}>
      <Play isPlaying={state.isPlaying ?? false} onClick={handleClick}/>
    </div>
    {/* <div>
      <label htmlFor="volume">Volume: </label>
      <input
        type="range"
        id="volume"
        name="volume"
        min="0"
        max="20"
        onChange={handleVolumeChange}
      />
    </div> */}
  </>
}
