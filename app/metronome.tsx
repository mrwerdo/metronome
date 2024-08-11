import { useState, useRef, useEffect, createRef, KeyboardEvent } from "react";
import { Sampler, Loop, getTransport } from "tone";
import studio_01 from "../tones/studio-01.aif?url";
import studio_02 from "../tones/studio-02.aif?url";
import coffee_shop from "../tones/coffee-shop.aif?url";

class MetronomeState {
  counter: number;

  constructor() {
    this.counter = 0;
  }
}

// https://coolors.co/091540-7692ff-abd2fa-3d518c-1b2cc1
// #091540
// #7692FF
// #ABD2FA
// #3D518C
// #1B2CC1

export const MetronomeCounter = () => {
  const [isLoaded, setLoaded] = useState(false);
  const sampler = useRef<Sampler | null>(null);
  const [numberOfBeats, setNumberOfBeats] = useState(4);
  const [numberOfSubBeats, setNumberOfSubBeats] = useState(3);
  const transport = getTransport();
  const loop = useRef<Loop | null>(null);
  const state = useRef<MetronomeState>(new MetronomeState());
  const [isPlaying, setIsPlaying] = useState(false);
  const [counter, setCounter] = useState(0);
  const [beatsPerMinute, setBeatsPerMinute] = useState(40);
  const div = createRef<HTMLDivElement>();

  if (typeof(transport.once) === "function") {
    transport.once("start", () => {
      setIsPlaying(true);
    });
    transport.once("stop", () => {
      setIsPlaying(false);
    });
  }

  useEffect(() => {
    div.current?.focus();
  }, []);

  useEffect(() => {
    sampler.current = new Sampler(
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
  }, []);

  useEffect(() => {
    const previous = loop.current;
    previous?.stop(0);
    loop.current = new Loop((time) => {
      console.log(`state.current.counter += 1`)
      state.current.counter += 1;
      if ((state.current.counter % (numberOfBeats * numberOfSubBeats)) === 0) {
        sampler.current!.triggerAttack("A1", time);
      } else if ((state.current.counter % numberOfSubBeats) === 0) {
        sampler.current!.triggerAttack("A2", time);
      } else {
        sampler.current!.triggerAttack("B1", time);
      }
      console.log(`setCounter(${state.current.counter % (numberOfBeats * numberOfSubBeats)})`)
      setCounter(state.current.counter);
    }, `4n`);
    if (transport.state === "started") {
      loop.current.start(0);
      console.log(`state.current.counter = 0`)
      state.current.counter = 0;
      console.log(`setCounter(${state.current.counter % (numberOfBeats * numberOfSubBeats)})`)
      setCounter(state.current.counter);
    }
  }, [numberOfBeats, numberOfSubBeats]);

  useEffect(() => {
    if (beatsPerMinute) {
      transport.bpm.value = beatsPerMinute * numberOfSubBeats;
    }
  }, [beatsPerMinute, numberOfSubBeats])

  const handleClick = () => {
    if (transport.state === "started") {
      transport.stop();
      loop.current!.stop();
    } else {
      transport.start();
      loop.current!.start(0);
      console.log(`state.current.counter = numberOfBeats * numberOfSubBeats - 1`)
      state.current.counter = -1;
    }
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