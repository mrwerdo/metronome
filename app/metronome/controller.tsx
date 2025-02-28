import { SectionType, SongType } from "../data";

export class Section implements SectionType {
    id: number;
    name: string;
    bpm: number;
    numberOfBeats: number;
    numberOfSubBeats: number;
    delay: number;
    numberOfBars: number;
    startOfSectionIndex: number = -1;

    public constructor(section: SectionType) {
        this.id = section.id;
        this.name = section.name;
        this.bpm = section.bpm;
        this.numberOfBeats = section.numberOfBeats;
        this.numberOfSubBeats = section.numberOfSubBeats;
        this.delay = section.delay;
        this.numberOfBars = section.numberOfBars;
    }

    public lengthInTicks(): number {
        return this.numberOfBars * this.numberOfBeats * this.numberOfSubBeats;
    }
}

export class Current {
    // Ranges between 0 and the number of bars
    currentBar: number;
    // Ranges between 0 and the number of beats
    currentBeat: number
    // Ranges between 0 and the number of sub-beats
    currentSubBeat: number;

    // aka tempo
    beatsPerMinute: number;

    numberOfBars: number;
    numberOfBeats: number;
    numberOfSubBeats: number;

    constructor(currentBar: number, currentBeat: number, currentSubBeat: number, beatsPerMinute: number, numberOfBars: number, numberOfBeats: number, numberOfSubBeats: number) {
        this.currentBar = currentBar;
        this.currentBeat = currentBeat;
        this.currentSubBeat = currentSubBeat;
        this.beatsPerMinute = beatsPerMinute;
        this.numberOfBars = numberOfBars;
        this.numberOfBeats = numberOfBeats;
        this.numberOfSubBeats = numberOfSubBeats;
    }
    
    public static fromCounterAndSection(counter: number, section: Section): Current {
        const counterRealtiveToSection = counter - section.startOfSectionIndex;
        const currentBeat = (~~(counterRealtiveToSection / section.numberOfSubBeats)) % section.numberOfBeats;
        const currentSubBeat = counterRealtiveToSection % section.numberOfSubBeats;
        const currentBar = ~~(counterRealtiveToSection / (section.numberOfBeats * section.numberOfSubBeats));
        return new Current(currentBar, currentBeat, currentSubBeat, section.bpm, section.numberOfBars, section.numberOfBeats, section.numberOfSubBeats);
    }
}

export class Index {
    section: number;
    bar: number;
    beat: number;
    subBeat: number;
    counter: number;
    sectionStartIndex: number;
    sectionLength: number;
    
    public constructor(section: number, bar: number, beat: number, subBeat: number, counter: number, sectionStartIndex: number, sectionLength: number) {
        this.section = section;
        this.bar = bar;
        this.beat = beat;
        this.subBeat = subBeat;
        this.counter = counter;
        this.sectionStartIndex = sectionStartIndex;
        this.sectionLength = sectionLength;
    }
}

export class Song implements SongType {
    id: string;
    name: string;
    favorite: boolean;
    instrument: string;
    createdAt: string;
    sections: Section[];

    constructor(song: SongType) {
        this.id = song.id;
        this.name = song.name;
        this.favorite = song.favorite;
        this.instrument = song.instrument;
        this.createdAt = song.createdAt;
        this.sections = song.sections.map((section) => new Section(section));
        this.updateStartOfSectionIndexes();
    }

    public updateStartOfSectionIndexes(): void {
        let count = 0;
        for (let index = 0; index < this.sections.length; index += 1) {
            const section = this.sections[index];
            section.startOfSectionIndex = count;
            const length = section.lengthInTicks();
            count += length;
        }
    }

    public indexGivenCounter(counter: number): Index {
        let count = 0;
        for (let sectionIndex = 0; sectionIndex < this.sections.length; sectionIndex += 1) {
            const section = this.sections[sectionIndex];
            const length = section.lengthInTicks();
            if (count <= counter && counter < count + length) {
                const counterRealtiveToSection = counter - count;
                const currentBeat = (~~(counterRealtiveToSection / section.numberOfSubBeats)) % section.numberOfBeats;
                const currentSubBeat = counterRealtiveToSection % section.numberOfSubBeats;
                const currentBar = ~~(counterRealtiveToSection / (section.numberOfBeats * section.numberOfSubBeats));
                return new Index(sectionIndex, currentBar, currentBeat, currentSubBeat, counter, section.startOfSectionIndex, length);
            } else {
                count += length;
            }
        }
        return new Index(-1, -1, -1, -1, -1, -1, -1);
    }

    public indexAtCoordinates(sectionIndex: number, barIndex: number, beatIndex: number, subBeatIndex: number): Index {
        const section = this.sections[sectionIndex];
        const counter = section.startOfSectionIndex + barIndex * section.numberOfBeats * section.numberOfSubBeats + beatIndex * section.numberOfSubBeats + subBeatIndex;
        if (counter < section.startOfSectionIndex || counter >= section.startOfSectionIndex + section.lengthInTicks()) {
            return new Index(-1, -1, -1, -1, -1, -1, -1);
        }
        return new Index(sectionIndex, barIndex, beatIndex, subBeatIndex, counter, section.startOfSectionIndex, section.lengthInTicks());
    }

    public indexNextSection(index: Index): Index {
        if (index.counter === -1) {
            return new Index(0, 0, 0, 0, 0, 0, 0);
        }
        if (index.bar === 0 && index.beat === 0 && index.subBeat === 0) {
            if (index.section === this.sections.length - 1) {
                return new Index(-1, -1, -1, -1, -1, -1, -1);
            } else {
                return this.indexGivenCounter(this.sections[index.section + 1].startOfSectionIndex);
            }
        } else {
            return this.indexGivenCounter(index.sectionStartIndex + index.sectionLength);
        }
    }

    public indexNextBar(index: Index): Index {
        const section = this.sections[index.section];
        const counter = index.counter + section.numberOfBeats * section.numberOfSubBeats;
        return this.indexGivenCounter(counter);
    }

    public indexNextBeat(index: Index): Index {
        const section = this.sections[index.section];
        const counter = index.counter + section.numberOfSubBeats;
        return this.indexGivenCounter(counter);
    }

    public indexNextSubBeat(index: Index): Index {
        const counter = index.counter + 1;
        return this.indexGivenCounter(counter);
    }

    public indexPreviousSection(index: Index): Index {
        if (index.bar === 0 && index.beat === 0 && index.subBeat === 0) {
            if (index.section === 0) {
                return this.indexGivenCounter(0);   
            } else {
                return this.indexGivenCounter(this.sections[index.section - 1].startOfSectionIndex);
            }
        } else {
            return this.indexGivenCounter(index.sectionStartIndex);
        }
    }

    public indexPreviousBar(index: Index): Index {
        const section = this.sections[index.section];
        const counter = index.counter - section.numberOfBeats * section.numberOfSubBeats;
        return this.indexGivenCounter(counter);
    }

    public indexPreviousBeat(index: Index): Index {
        const section = this.sections[index.section];
        const counter = index.counter - section.numberOfSubBeats;
        return this.indexGivenCounter(counter);
    }

    public indexPreviousSubBeat(index: Index): Index {
        const counter = index.counter - 1;
        return this.indexGivenCounter(counter);
    }
}

export class Controller {

    // Questions I need answered by this class:
    // 1. What is the current beat?
    // 2. What is the current sub-beat?
    // 3. Which bar is currently active?
    // 4. What is the current tempo?
    // 5. What is the current time signature?
    // 6. What is the current volume?
    // 7. Given a bar, how many beats does it have?
    // 8. Given a bar, what subdivisions does it have?
    // 9. Given a bar, does it have any extra timing modifiers?
    // 10. I need to represent a count in vs no count in.

    public get counter(): number {
        return this.currentIndex.counter;
    }

    public set counter(_counter) {
        this.currentIndex = this.song.indexGivenCounter(_counter);
    }

    currentIndex: Index;
    song: Song;

    private slowCurrentSectionAndBar(): [Section | null, number] {
        let count = 0;
        for (let index = 0; index < this.song.sections.length; index += 1) {
            const section = this.song.sections[index];
            const length = section.lengthInTicks();
            if (count <= this.counter && this.counter < count + length) {
                return [this.song.sections[index], count];
            } else {
                count += length;
            }
        }
        return [null, 0];
    }

    constructor(song: SongType) {
        this.song = new Song(song);
        this.currentIndex = new Index(0, 0, 0, 0, 0, 0, 0);
    }

    public currentSection(): Section | null {
        for (let section of this.song.sections) {
            if (this.counter >= section.startOfSectionIndex && this.counter < section.startOfSectionIndex + section.lengthInTicks()) {
                return section;
            }
        }
        return null;
    }

    public current(): Current | null {
        const [section, _] = this.slowCurrentSectionAndBar();
        if (section === null) {
            return null;
        }
        return Current.fromCounterAndSection(this.counter, section);
    }

    public numberOfBars(): number {
        return this.song.sections.reduce((value, section) => value + section.numberOfBars, 0);
    }
    
    public isSectionActive(section: Section): boolean {
        // Why didn't === work here?
        // return section === this.currentSection();
        const currentSection = this.currentSection();
        return section.id == currentSection?.id
        && section.name == currentSection?.name
        && section.bpm == currentSection?.bpm
        && section.numberOfBeats == currentSection?.numberOfBeats
        && section.numberOfSubBeats == currentSection?.numberOfSubBeats
        && section.delay == currentSection?.delay
        && section.numberOfBars == currentSection?.numberOfBars;
    }

    public isBarActive(section: Section, barIndex: number): boolean {
        return this.current()?.currentBar == barIndex && this.isSectionActive(section);
    }

    public isBeatActive(section: Section, barIndex: number, beatIndex: number): boolean {
        const current = Current.fromCounterAndSection(this.counter, section);
        if (current === null) {
            return false;
        } else {
            return current.currentBar == barIndex && current.currentBeat == beatIndex;
        }
    }

    public isSubBeatActive(section: Section, barIndex: number, beatIndex: number, subBeatIndex: number): boolean {
        const current = Current.fromCounterAndSection(this.counter, section);
        if (current === null) {
            return false;
        } else {
            return current.currentBar == barIndex && current.currentBeat == beatIndex && current.currentSubBeat == subBeatIndex;
        }
    }

    public nextSection(): number {
        return this.song.indexNextSection(this.currentIndex).counter;
    }

    public nextBar(): number {
        const current = this.current();
        const currentSection = this.currentSection();
        if (current === null || currentSection === null) {
            return 0;
        } else {
            if (currentSection === this.song.sections[this.song.sections.length - 1] && current.currentBar === currentSection.numberOfBars - 1) {
                return -1;
            }
            return currentSection.startOfSectionIndex + (current.currentBar + 1) * currentSection.numberOfBeats * currentSection.numberOfSubBeats;
        }
    }

    public nextBeat(): number {
        const current = this.current();
        const currentSection = this.currentSection();
        if (current === null || currentSection === null) {
            return 0;
        } else {
            if (currentSection === this.song.sections[this.song.sections.length - 1] && current.currentBar === currentSection.numberOfBars - 1 && current.currentBeat === currentSection.numberOfBeats - 1) {
                return -1;
            }
            return currentSection.startOfSectionIndex + current.numberOfBars * current.numberOfBeats * current.numberOfSubBeats;
        }
    }

    public nextSubBeat(): number {
        const lastSection = this.song.sections[this.song.sections.length - 1];
        const lastIndex = lastSection.startOfSectionIndex + lastSection.lengthInTicks() - 1;
        if (this.counter === lastIndex) {
            return -1;
        }
        return this.counter + 1;
    }

    private findPreviousSectionGivenSection(current: Section): Section | null {
        for (let index = 0; index < this.song.sections.length; index += 1) {
            const section = this.song.sections[index];
            if (section.startOfSectionIndex === current.startOfSectionIndex) {
                if (index === 0) {
                    return null;
                } else {
                    return this.song.sections[index - 1];
                }
            }
        }
        return null;
    }

    public previousSection(): number {
        const current = this.currentSection();
        if (current === null) {
            return 0;
        } else if (current.startOfSectionIndex === 0) {
            return 0;
        } else {
            if (current.startOfSectionIndex !== this.counter) {
                return current.startOfSectionIndex;
            }
            const previous = this.findPreviousSectionGivenSection(current);
            if (previous === null) {
                return 0;
            }
            return previous.startOfSectionIndex;
        }
    }

    public previousBar(): number {
        const current = this.current();
        const currentSection = this.currentSection();
        if (current === null || currentSection === null) {
            return 0;
        } else {
            if (currentSection.startOfSectionIndex === this.counter) {
                const previousSection = this.findPreviousSectionGivenSection(currentSection);
                if (previousSection === null) {
                    return 0;
                }
                return previousSection.startOfSectionIndex + (previousSection.numberOfBars - 1) * previousSection.numberOfBeats * previousSection.numberOfSubBeats;
            } else {
                return currentSection.startOfSectionIndex + (current.currentBar - 1) * currentSection.numberOfBeats * currentSection.numberOfSubBeats;
            }
        }
    }

    public previousBeat(): number {
        const current = this.current();
        const currentSection = this.currentSection();
        if (current === null || currentSection === null) {
            return 0;
        } else {
            if (currentSection.startOfSectionIndex === this.counter) {
                const previousSection = this.findPreviousSectionGivenSection(currentSection);
                if (previousSection === null) {
                    return 0;
                }
                return previousSection.startOfSectionIndex + (previousSection.numberOfBars - 1) * previousSection.numberOfBeats * previousSection.numberOfSubBeats + (previousSection.numberOfBeats - 1) * previousSection.numberOfSubBeats;
            } else {
                if (current.currentSubBeat > 0) {
                    return this.counter - current.currentSubBeat;
                } else {
                    return this.counter - current.numberOfSubBeats;
                }
            }
        }
    }

    public moveNextSection(): void {
        this.counter = this.nextSection();
    }

    public moveNextBar(): void {
        this.counter = this.nextBar();
    }

    public moveNextBeat(): void {
        this.counter = this.nextBeat();
    }

    public moveNextSubBeat(): void {
        this.counter = this.nextSubBeat();
    }

    public movePreviousSection(): void {
        this.counter = this.previousSection();
    }

    public movePreviousBar(): void {
        this.counter = this.previousBar();
    }

    public movePreviousBeat(): void {
        this.counter = this.previousBeat();
    }
}