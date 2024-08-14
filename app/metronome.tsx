import { useState, useRef, useEffect, createRef, KeyboardEvent, useLayoutEffect } from "react";
import { Sampler, Loop, getTransport } from "tone";
import studio_01 from "../tones/studio-01.aif?url";
import studio_02 from "../tones/studio-02.aif?url";
import coffee_shop from "../tones/coffee-shop.aif?url";
import { SongRecord } from "./data";
import { TransportClass } from "tone/build/esm/core/clock/Transport";

class MetronomeState {
  counter: number
  song: SongRecord
  transport: TransportClass
  loop: Loop
  sampler: Sampler
  numberOfBeats: number
  numberOfSubBeats: number
  setCounter: React.Dispatch<React.SetStateAction<number>>
  setLoaded: React.Dispatch<React.SetStateAction<boolean>>

  constructor(song: SongRecord, numberOfBeats: number, numberOfSubBeats: number, setCounter: React.Dispatch<React.SetStateAction<number>>, setLoaded: React.Dispatch<React.SetStateAction<boolean>>) {
    this.counter = 0
    this.song = song
    this.numberOfBeats = numberOfBeats;
    this.numberOfSubBeats = numberOfSubBeats;
    this.transport = getTransport();
    this.setCounter = setCounter
    this.setLoaded = setLoaded
    this.loop = new Loop((time) => {
      console.log(`state.current.counter += 1`)
      this.counter += 1;
      if ((this.counter % (this.numberOfBeats * this.numberOfSubBeats)) === 0) {
        this.sampler.triggerAttack("A1", time);
      } else if ((this.counter % this.numberOfSubBeats) === 0) {
        this.sampler.triggerAttack("A2", time);
      } else {
        this.sampler.triggerAttack("B1", time);
      }
      console.log(`setCounter(${this.counter % (this.numberOfBeats * this.numberOfSubBeats)})`)
      this.setCounter(this.counter);
    }, `4n`);

    this.sampler = new Sampler(
      {
        "A1": studio_01, 
        "A2": studio_02,
        "B1": coffee_shop
      },
      {
        onload: () => {
          setLoaded(true);
        }
      }
    ).toDestination();
  }

  setNumberOfBeatsAndSubBeats(beats: number, subbeats: number) {
    this.numberOfBeats = beats
    this.numberOfSubBeats = subbeats
    const previous = this.loop;
    previous?.stop(0);
    this.loop = new Loop((time) => {
      console.log(`state.current.counter += 1`)
      this.counter += 1;
      if ((this.counter % (this.numberOfBeats * this.numberOfSubBeats)) === 0) {
        this.sampler.triggerAttack("A1", time);
      } else if ((this.counter % this.numberOfSubBeats) === 0) {
        this.sampler.triggerAttack("A2", time);
      } else {
        this.sampler.triggerAttack("B1", time);
      }
      console.log(`setCounter(${this.counter % (this.numberOfBeats * this.numberOfSubBeats)})`)
      this.setCounter(this.counter);
    }, `4n`);

    if (this.transport.state === "started") {
      this.loop.start(0);
      console.log(`state.current.counter = 0`)
      this.counter = 0;
      console.log(`setCounter(${this.counter % (this.numberOfBeats * this.numberOfSubBeats)})`)
      this.setCounter(this.counter);
    }
  }

  toggleIsPlaying() {
    if (this.transport.state === "started") {
      this.transport.stop();
      this.loop.stop();
    } else {
      this.transport.start();
      this.loop.start(0);
      console.log(`state.current.counter = numberOfBeats * numberOfSubBeats - 1`)
      this.counter = -1;
    }
  }
}

// https://coolors.co/091540-7692ff-abd2fa-3d518c-1b2cc1
// #091540
// #7692FF
// #ABD2FA
// #3D518C
// #1B2CC1

export const MetronomeCounter = ({ song }: { song: SongRecord }) => {
  const [isLoaded, setLoaded] = useState(false);
  const [numberOfBeats, setNumberOfBeats] = useState(4);
  const [numberOfSubBeats, setNumberOfSubBeats] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [counter, setCounter] = useState(0);
  const state = useRef<MetronomeState>(new MetronomeState(song, numberOfBeats, numberOfSubBeats, setCounter, setLoaded));
  const [beatsPerMinute, setBeatsPerMinute] = useState(40);
  const div = createRef<HTMLDivElement>();

  if (typeof(state.current.transport.once) === "function") {
    state.current.transport.once("start", () => {
      setIsPlaying(true);
    });
    state.current.transport.once("stop", () => {
      setIsPlaying(false);
    });
  }

  useEffect(() => {
    div.current?.focus();
  }, []);
  
  useEffect(() => {
    state.current.song = song;
    state.current.setLoaded = setLoaded;
    state.current.setCounter = setCounter;
  }, [song, setLoaded, setCounter]);

  useEffect(() => {
    state.current.setNumberOfBeatsAndSubBeats(numberOfBeats, numberOfSubBeats)
  }, [numberOfBeats, numberOfSubBeats]);

  useEffect(() => {
    if (beatsPerMinute) {
      state.current.transport.bpm.value = beatsPerMinute * numberOfSubBeats;
    }
  }, [beatsPerMinute, numberOfSubBeats])

  const handleClick = () => {
    state.current.toggleIsPlaying();
  };

  const keypress = (event: KeyboardEvent) => {
    if (event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }

  const currentBeat = (~~(state.current.counter / numberOfSubBeats));
  const subbeat = state.current.counter % numberOfSubBeats;

  return (
    <>
      <div ref={div} tabIndex={0} onKeyDown={keypress}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <p style={{ fontSize: 50 }}>{(currentBeat % numberOfBeats) + 1}.<span style={{ fontSize: 30 }}>{subbeat + 1}</span></p>
          <p style={{ fontSize: 15, marginLeft: 'auto' }}>Counter: {state.current.counter}</p>
          <p style={{ fontSize: 15, marginLeft: '1em' }}>Normalized Counter: {state.current.counter % (numberOfBeats * numberOfSubBeats)}</p>
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
                  fontWeight: currentBeat === index % numberOfBeats ? 'bold' : 'normal',
                  backgroundColor:  currentBeat % numberOfBeats === index ? '#7692FF' : '#ABD2FA',
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
                  backgroundColor:  subbeat === index % numberOfSubBeats ? '#7692FF' : '#ABD2FA',
                }}>{index + 1}</span>
            })
          }
        </div>
        <label>
          BPM:
          <input type='number' value={beatsPerMinute} onChange={e => setBeatsPerMinute(parseInt(e.target.value))} />
        </label>
        <br/>
        <label>
          Beats:
          <input type='number' value={numberOfBeats} onChange={e => setNumberOfBeats(parseInt(e.target.value))} />
        </label>
        <br/>
        <label>
          Sub-beats
          <input type='number' value={numberOfSubBeats} onChange={e => setNumberOfSubBeats(parseInt(e.target.value))} />
        </label>
        <div>
          <button disabled={!isLoaded} onClick={handleClick}>
            {isPlaying ? "Stop" : "Play"}
          </button>
        </div>
      </div>
    </>
  );
};