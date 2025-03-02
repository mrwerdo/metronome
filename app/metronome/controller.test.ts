import { assert, expect, test } from 'vitest'
import { Controller, Current, Section, Song } from './controller'
import { extractRemixPluginContext } from '@remix-run/dev/dist/vite/plugin';

function getSong() {
    const song = new Song({
        id: '1',
        name: 'test',
        favorite: false,
        instrument: 'test',
        createdAt: 'test',
        sections: [
            {
                id: 1,
                name: 'A',
                bpm: 120,
                numberOfBeats: 5,
                numberOfSubBeats: 4,
                delay: 0,
                numberOfBars: 3,
            },
            {
                id: 2,
                name: 'B',
                bpm: 120,
                numberOfBeats: 4,
                numberOfSubBeats: 4,
                delay: 0,
                numberOfBars: 4,
            }
        ]
    });
    return song;
}

test('section: length = bars * beats * subBeats', () => {
    const section = new Section({
        id: 1,
        name: 'test',
        bpm: 120,
        numberOfBeats: 4,
        numberOfSubBeats: 4,
        delay: 0,
        numberOfBars: 4,
    });
    expect(section.lengthInTicks()).toBe(4 * 4 * 4);
});

test('song: updateStartOfSectionIndexes', () => {
    const song = getSong();
    song.updateStartOfSectionIndexes();
    expect(song.sections[0].startOfSectionIndex).toBe(0);
    expect(song.sections[1].startOfSectionIndex).toBe(5 * 4 * 3);
});

test('song: indexNextBar', () => {
    const song = getSong();
    song.updateStartOfSectionIndexes();
    const bar0 = song.indexAtCoordinates(0, 0, 0, 0);
    const bar1 = song.indexAtCoordinates(0, 1, 0, 0);
    expect(song.indexNextBar(bar0).counter).toBe(bar1.counter);
});

test('song: indexNextBeat', () => {
    const song = getSong();
    song.updateStartOfSectionIndexes();
    const bar0 = song.indexAtCoordinates(0, 0, 0, 0);
    const beat1 = song.indexAtCoordinates(0, 0, 1, 0);
    expect(song.indexNextBeat(bar0).counter).toBe(beat1.counter);
});

test('song: indexNextSubBeat', () => {
    const song = getSong();
    song.updateStartOfSectionIndexes();
    const bar0 = song.indexAtCoordinates(0, 0, 0, 0);
    const subBeat1 = song.indexAtCoordinates(0, 0, 0, 1);
    expect(song.indexNextSubBeat(bar0).counter).toBe(subBeat1.counter);
});

test('song: indexPreviousBar', () => {
    const song = getSong();
    song.updateStartOfSectionIndexes();
    const bar0 = song.indexAtCoordinates(0, 0, 0, 0);
    const bar1 = song.indexAtCoordinates(0, 1, 0, 0);
    expect(song.indexPreviousBar(bar1).counter).toBe(bar0.counter);
});

test('song: indexPreviousBeat', () => {
    const song = getSong();
    song.updateStartOfSectionIndexes(); 
    const bar0 = song.indexAtCoordinates(0, 0, 0, 0);
    const beat1 = song.indexAtCoordinates(0, 0, 1, 0);
    expect(song.indexPreviousBeat(beat1).counter).toBe(bar0.counter);
});

test('song: indexPreviousSubBeat', () => {
    const song = getSong();
    song.updateStartOfSectionIndexes();
    const bar0 = song.indexAtCoordinates(0, 0, 0, 0);
    const subBeat1 = song.indexAtCoordinates(0, 0, 0, 1);
    expect(song.indexPreviousSubBeat(subBeat1).counter).toBe(bar0.counter);
});

test('controller: currentSection', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks();
    expect(controller.currentSection()).toStrictEqual(song.sections[1]);
});

test('controller: currentSection is null at end of song', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() + song.sections[1].lengthInTicks();
    expect(controller.currentSection()).toStrictEqual(null);
});

test('controller: current bar start of song', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 0;
    const result = controller.current();
    assert(result);
    expect(result.numberOfBeats).toBe(song.sections[0].numberOfBeats);
    expect(result.numberOfSubBeats).toBe(song.sections[0].numberOfSubBeats);
    expect(result.beatsPerMinute).toBe(song.sections[0].bpm);
    expect(result.currentBeat).toBe(0);
});

test('controller: current bar part way through section', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 5;
    const result = controller.current();
    assert(result);
    expect(result.numberOfBeats).toBe(song.sections[0].numberOfBeats);
    expect(result.numberOfSubBeats).toBe(song.sections[0].numberOfSubBeats);
    expect(result.beatsPerMinute).toBe(song.sections[0].bpm);
    expect(result.currentBeat).toBe(1);
});

test('controller: current bar between first and second section', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() + 1;
    const result = controller.current();
    assert(result);
    expect(result.numberOfBeats).toBe(song.sections[1].numberOfBeats);
    expect(result.numberOfSubBeats).toBe(song.sections[1].numberOfSubBeats);
    expect(result.beatsPerMinute).toBe(song.sections[1].bpm);
    expect(result.currentBeat).toBe(0);
});

test('controller: current bar end of song', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() + song.sections[1].lengthInTicks();
    const result = controller.current();
    expect(result).toBe(null);
});

test('controller: current bar beatIndex', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 6;
    const result = controller.current();
    assert(result);
    expect(result.currentBeat).toBe(1);
});

test('controller: current bar subBeatIndex', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 6;
    const result = controller.current();
    assert(result);
    expect(result.currentSubBeat).toBe(2);
});

test('controller: currentGivenCounterAndSection', () => {
    const song = getSong();
    const controller = new Controller(song);
    const result = Current.fromCounterAndSection(6, song.sections[0]);
    assert(result);
    expect(result.currentBeat).toBe(1);
    expect(result.currentSubBeat).toBe(2);
});

test('controller: isSectionActive', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 0;
    expect(controller.isSectionActive(song.sections[0])).toBe(true);
    expect(controller.isSectionActive(song.sections[1])).toBe(false);
});

test('controller: isBarActive', () => {
    const song = getSong();
    const controller = new Controller(song);
    // Move forward to...
    controller.counter = /* second section */ song.sections[0].lengthInTicks() + /* second bar */ 16;
    expect(controller.isBarActive(song.sections[0], 0)).toBe(false);
    expect(controller.isBarActive(song.sections[0], 1)).toBe(false);
    expect(controller.isBarActive(song.sections[1], 0)).toBe(false);
    expect(controller.isBarActive(song.sections[1], 1)).toBe(true);
});

test('controller: isBeatActive', () => {
    const song = getSong();
    const controller = new Controller(song);
    // Move forward to...
    controller.counter = /* second section */ song.sections[0].lengthInTicks() + /* first bar, last beat */ 12
    expect(controller.isBeatActive(song.sections[1], 0, 3)).toBe(true);
    expect(controller.isBeatActive(song.sections[1], 1, 0)).toBe(false);
});

test('controller: isSubBeatActive', () => {
    const song = getSong();
    const controller = new Controller(song);
    // Move forward to...
    controller.counter = /* second section */ song.sections[0].lengthInTicks() + /* first bar, last beat, last subBeat */ 15;
    expect(controller.isSubBeatActive(song.sections[1], 0, 3, 3)).toBe(true);
    expect(controller.isSubBeatActive(song.sections[1], 0, 3, 0)).toBe(false);
});

test('controller: nextSection', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 0;
    expect(controller.nextSection()).toBe(5 * 4 * 3);
});

test('controller: nextSection end of section A goes to section B', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() - 1;
    expect(controller.nextSection()).toBe(5 * 4 * 3);
});

test('controller: nextSection end of section B stops before beginning.', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks();
    expect(controller.nextSection()).toBe(-1);
});

test('controller: nextSection stopped before beginning starts piece.', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = -1;
    expect(controller.nextSection()).toBe(0);
});

test('controller: nextBar', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 0;
    expect(controller.nextBar()).toBe(5 * 4);
});

test('controller: nextBar end of section A goes to section B', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() - 1;
    expect(controller.nextBar()).toBe(5 * 4 * 3);
});

test('controller: nextBar end of section B stops before beginning.', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() + /* numberOfBars */ 4 * /* timeSignature */ 4 * /* numberOfSubBeats */ 3;
    expect(controller.nextBar()).toBe(-1);
});

test('controller: nextBar stopped before beginning starts piece.', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = -1;
    expect(controller.nextBar()).toBe(0);
});

test('controller: nextBeat', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 0;
    expect(controller.nextBeat()).toBe(5 * 4 * 3);
});

test('controller: nextBeat end of section A goes to section B', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() - 1;
    expect(controller.nextBeat()).toBe(5 * 4 * 3);
});

test('controller: nextBeat end of section B stops before beginning.', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() + /* 4 bars, 4 beats, 4 subbeats */ 4 * (4 * 4 - 1);
    // this is not 4 * 4 * 3 because:
    // 4 bars * 4 beats * 4 subbeats points to the end of the section.
    // 4 bars * 4 beats * 4 subbeats - 1 points to the last subbeat of the last beat of the last bar.
    // and 4 bars * 4 beats * 4 subbeats - 4 points to the first subbeat of the last beat of the last bar.
    // On the other hand,
    // 4 bars * 4 beats * 3 subbeats is a different structure, rearranged:
    // 3 bars * 4 beats * 4 subbeats points to the start of the 4th bar, which still has 4 * 4 ticks until the end of the section.
    expect(controller.nextBeat()).toBe(-1);
});

test('controller: nextBeat stopped before beginning starts piece.', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = -1;
    expect(controller.nextBeat()).toBe(0);
});

test('controller: nextSubBeat', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 0;
    expect(controller.nextSubBeat()).toBe(1);
});

test('controller: nextSubBeat end of section A goes to section B', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() - 1;
    expect(controller.nextSubBeat()).toBe(5 * 4 * 3);
});

test('controller: nextSubBeat end of section B stops before beginning.', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() + /* 4 bars, 4 beats, 4 subbeats */ 4 * 4 * 4 - 1;
    expect(controller.nextSubBeat()).toBe(-1);
});

test('controller: previousSection at beginning of song is 0', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 0;
    expect(controller.previousSection()).toBe(0);
});

test('controller: previousSection at beginning of section B goes to section A', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() + song.sections[1].lengthInTicks();
    expect(controller.previousSection()).toBe(0);
});

test('controller: previousSection in middle of section B goes to section B', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() + 1 * 4 * 4;
    expect(controller.previousSection()).toBe(song.sections[1].startOfSectionIndex);
});

test('controller: previousSection at beginning of section C goes to section B', () => {
    const song = new Song({
        id: '1',
        name: 'test',
        favorite: false,
        instrument: 'test',
        createdAt: 'test',
        sections: [
            {
                id: 1,
                name: 'A',
                bpm: 120,
                numberOfBeats: 5,
                numberOfSubBeats: 4,
                delay: 0,
                numberOfBars: 3,
            },
            {
                id: 2,
                name: 'B',
                bpm: 120,
                numberOfBeats: 4,
                numberOfSubBeats: 4,
                delay: 0,
                numberOfBars: 4,
            },
            {
                id: 3,
                name: 'C',
                bpm: 120,
                numberOfBeats: 5,
                numberOfSubBeats: 5,
                delay: 0,
                numberOfBars: 5,
            }
        ]
    });
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() + song.sections[1].lengthInTicks();
    expect(controller.previousSection()).toBe(song.sections[0].lengthInTicks());
});


test('controller: previousBar at beginning of song is 0', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 0;
    expect(controller.previousBar()).toBe(0);
});

test('controller: previousBar at bar 3 of section A is bar 2 of section A', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 2 * 5 * 4;
    expect(controller.previousBar()).toBe(1 * 5 * 4);
});

test('controller: previousBar at beginning of section B goes to section A last bar of section A', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks();
    expect(controller.previousBar()).toBe(song.sections[0].lengthInTicks() - song.sections[0].numberOfBeats * song.sections[0].numberOfSubBeats);
});

test('controller: previousBar in bar 3 of section B goes to bar 2 of section B', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() + 2 * 4 * 4;
    expect(controller.previousBar()).toBe(song.sections[0].lengthInTicks() + 1 * 4 * 4);
});

test('controller: previousBar at beginning of section C goes to section B', () => {
    const song = new Song({
        id: '1',
        name: 'test',
        favorite: false,
        instrument: 'test',
        createdAt: 'test',
        sections: [
            {
                id: 1,
                name: 'A',
                bpm: 120,
                numberOfBeats: 5,
                numberOfSubBeats: 4,
                delay: 0,
                numberOfBars: 3,
            },
            {
                id: 2,
                name: 'B',
                bpm: 120,
                numberOfBeats: 4,
                numberOfSubBeats: 4,
                delay: 0,
                numberOfBars: 4,
            },
            {
                id: 3,
                name: 'C',
                bpm: 120,
                numberOfBeats: 5,
                numberOfSubBeats: 5,
                delay: 0,
                numberOfBars: 5,
            }
        ]
    });
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks() + song.sections[1].lengthInTicks();
    expect(controller.previousBar()).toBe(song.sections[0].lengthInTicks() + 3 * 4 * 4);
});

test('controller: previousBeat at beginning of song is 0', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 0;
    expect(controller.previousBeat()).toBe(0);
});

test('controller: previousBeat at beat 3 of bar 3 of section A is beat 2 of bar 3 of section A', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 1 * 5 * 4 + 1 * 2 * 4;
    expect(controller.previousBeat()).toBe(1 * 5 * 4 + 1 * 1 * 4);
});

test('controller: previousBeat at beat 3 subbeat 2 of bar 3 of section A is beat 3 subbeat 1 of bar 3 of section A', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = 1 * 5 * 4 + 1 * 2 * 4 + 1;
    expect(controller.previousBeat()).toBe(1 * 5 * 4 + 1 * 2 * 4);
})

test('controller: previousBeat at beginning of section B goes to section A last beat of section A', () => {
    const song = getSong();
    const controller = new Controller(song);
    controller.counter = song.sections[0].lengthInTicks();
    expect(controller.previousBeat()).toBe(song.sections[0].lengthInTicks() - song.sections[0].numberOfSubBeats);
});