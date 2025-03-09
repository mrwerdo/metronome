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

    public equals(section: Section): boolean {
        return section.id === this.id
        && section.name === this.name
        && section.bpm === this.bpm
        && section.numberOfBeats === this.numberOfBeats
        && section.numberOfSubBeats === this.numberOfSubBeats
        && section.delay === this.delay
        && section.numberOfBars === this.numberOfBars
        && section.startOfSectionIndex === this.startOfSectionIndex;
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

    public toString(): string {
        return `section: ${this.section}, bar: ${this.bar}, beat: ${this.beat}, subBeat: ${this.subBeat}, counter: ${this.counter}, sectionStartIndex: ${this.sectionStartIndex}, sectionLength: ${this.sectionLength}`;
    }

    public equals(index: Index): boolean {
        return this.section === index.section
            && this.bar === index.bar
            && this.beat === index.beat
            && this.subBeat === index.subBeat
            && this.counter === index.counter
            && this.sectionStartIndex === index.sectionStartIndex
            && this.sectionLength === index.sectionLength;
    }

    public copy(): Index {
        return new Index(this.section, this.bar, this.beat, this.subBeat, this.counter, this.sectionStartIndex, this.sectionLength);
    }

    public isSameSection(index: Index): boolean {
        return this.section === index.section;
    }

    public isSameBar(index: Index): boolean {
        return this.section === index.section && this.bar === index.bar;
    }

    public isSameBeat(index: Index): boolean {
        return this.section === index.section && this.bar === index.bar && this.beat === index.beat;
    }

    public isSameSubBeat(index: Index): boolean {
        return this.section === index.section && this.bar === index.bar && this.beat === index.beat && this.subBeat === index.subBeat;
    }

    public isBefore(index: Index): boolean {
        return this.counter < index.counter;
    }

    public isAfter(index: Index): boolean {
        return this.counter > index.counter;
    }

    public static NotAnIndex(): Index {
        return new Index(-1, -1, -1, -1, -1, -1, -1);
    }

    public isNotAnIndex(): boolean {
        return this.counter === -1;
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

    public isValidIndex(index: Index): boolean {
        return index.section >= 0 && index.section < this.sections.length
            && index.bar >= 0 && index.bar < this.sections[index.section].numberOfBars
            && index.beat >= 0 && index.beat < this.sections[index.section].numberOfBeats
            && index.subBeat >= 0 && index.subBeat < this.sections[index.section].numberOfSubBeats
            && index.counter >= this.sections[index.section].startOfSectionIndex
            && index.counter < this.sections[index.section].startOfSectionIndex + this.sections[index.section].lengthInTicks();
    }

    private checkValid(index: Index) {
        // todo: check counter against a computed value, and throw if not equal.
        if (!this.isValidIndex(index)) {
            throw Error(`invalid index: ${index.toString()}`);
        }
    }

    public indexAtCoordinates(sectionIndex: number, barIndex: number, beatIndex: number, subBeatIndex: number): Index {
        if (sectionIndex >= this.sections.length) {
            return new Index(-1, -1, -1, -1, -1, -1, -1);
        }
        const section = this.sections[sectionIndex];
        const counter = section.startOfSectionIndex + barIndex * section.numberOfBeats * section.numberOfSubBeats + beatIndex * section.numberOfSubBeats + subBeatIndex;
        const index = new Index(sectionIndex, barIndex, beatIndex, subBeatIndex, counter, section.startOfSectionIndex, section.lengthInTicks());
        if (this.isValidIndex(index)) {
            return index;
        } else {
            return Index.NotAnIndex();
        }
    }

    private _noCheckNextSection(index: Index): Index {
        return this.indexAtCoordinates(index.section + 1, 0, 0, 0);
    }

    private _noCheckNextBar(index: Index): Index {
        const section = this.sections[index.section];
        if (index.bar === section.numberOfBars - 1) {
            return this._noCheckNextSection(index);
        } else {
            return this.indexAtCoordinates(index.section, index.bar + 1, 0, 0);
        }
    }

    private _noCheckNextBeat(index: Index): Index {
        const section = this.sections[index.section];
        if (index.beat === section.numberOfBeats - 1) {
            return this._noCheckNextBar(index);
        } else {
            return this.indexAtCoordinates(index.section, index.bar, index.beat + 1, 0); 
        }
    }

    private _noCheckNextSubBeat(index: Index): Index {
        const section = this.sections[index.section];
        if (index.subBeat === section.numberOfSubBeats - 1) {
            return this._noCheckNextBeat(index);
        } else {
            return this.indexAtCoordinates(index.section, index.bar, index.beat, index.subBeat + 1);
        }
    }

    private _noCheckPreviousSection(index: Index): Index {
        if (index.bar > 0) {
            return this.indexAtCoordinates(index.section, 0, 0, 0);
        }
        return index.section === 0 ? this.firstIndex() : this.indexAtCoordinates(index.section - 1, 0, 0, 0);
    }

    private _noCheckPreviousBar(index: Index): Index {
        if (index.beat > 0) {
            return this.indexAtCoordinates(index.section, index.bar, 0, 0);
        }
        if (index.bar === 0) {
            if (index.section === 0) {
                return this.firstIndex();
            } else {
                const section = this.sections[index.section - 1];
                return this.indexAtCoordinates(index.section - 1, section.numberOfBars - 1, 0, 0);
            }
        } else {
            return index.bar === 0 ? this._noCheckPreviousSection(index) : this.indexAtCoordinates(index.section, index.bar - 1, 0, 0);
        }
    }

    private _noCheckPreviousBeat(index: Index): Index {
        if (index.subBeat > 0) {
            return this.indexAtCoordinates(index.section, index.bar, index.beat, 0);
        }
        return index.beat === 0 ? this._noCheckPreviousBar(index) : this.indexAtCoordinates(index.section, index.bar, index.beat - 1, 0);
    }

    private _noCheckPreviousSubBeat(index: Index): Index {
        return index.subBeat === 0 ? this._noCheckPreviousBeat(index) : this.indexAtCoordinates(index.section, index.bar, index.beat, index.subBeat - 1);
    }

    public indexNextSection(index: Index): Index {
        this.checkValid(index);
        return this._noCheckNextSection(index);
    }

    public indexNextBar(index: Index): Index {
        this.checkValid(index);
        return this._noCheckNextBar(index);
    }

    public indexNextBeat(index: Index): Index {
        this.checkValid(index);
        return this._noCheckNextBeat(index);
    }

    public indexNextSubBeat(index: Index): Index {
        this.checkValid(index);
        return this._noCheckNextSubBeat(index);
    }

    public indexPreviousSection(index: Index): Index {
        this.checkValid(index);
        return this._noCheckPreviousSection(index);
    }

    public indexPreviousBar(index: Index): Index {
        this.checkValid(index);
        return this._noCheckPreviousBar(index);
    }

    public indexPreviousBeat(index: Index): Index {
        this.checkValid(index);
        return this._noCheckPreviousBeat(index);
    }

    public indexPreviousSubBeat(index: Index): Index {
        this.checkValid(index);
        return this._noCheckPreviousSubBeat(index);
    }

    public firstIndex(): Index {
        if (this.sections.length === 0) {
            return new Index(-1, -1, -1, -1, -1, -1, -1);
        }
        const firstSection = this.sections[0];
        return new Index(
            0,
            0,
            0,
            0,
            0,
            0,
            firstSection.lengthInTicks()
        );
    }

    public lastIndex(): Index {
        if (this.sections.length === 0) {
            return new Index(-1, -1, -1, -1, -1, -1, -1);
        }
        const lastSectionIndex = this.sections.length - 1;
        const lastSection = this.sections[lastSectionIndex];
        return new Index(
            lastSectionIndex,
            lastSection.numberOfBars - 1,
            lastSection.numberOfBeats - 1,
            lastSection.numberOfSubBeats - 1,
            lastSection.startOfSectionIndex + lastSection.lengthInTicks() - 1,
            lastSection.startOfSectionIndex,
            lastSection.lengthInTicks()
        );
    }

    public equals(song: Song): boolean {
        const initial = this.id == song.id
        && this.name == song.name
        && this.favorite == song.favorite
        && this.instrument == song.instrument
        && this.createdAt == song.createdAt
        && this.sections.length === song.sections.length
        if (initial) {
            for (let i = 0; i < this.sections.length; i += 1) {
                if (!this.sections[i].equals(song.sections[i])) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }
}

export class Controller {
    private song: Song;
    public currentIndex: Index;

    // Tests currently depend upon this. Ideally move to a different method.
    public get counter(): number {
        return this.currentIndex.counter;
    }

    public set counter(_counter: number) {
        let count = 0;
        for (let sectionIndex = 0; sectionIndex < this.song.sections.length; sectionIndex += 1) {
            const section = this.song.sections[sectionIndex];
            const length = section.lengthInTicks();
            if (count <= _counter && _counter < count + length) {
                const counterRealtiveToSection = _counter - count;
                const currentBeat = (~~(counterRealtiveToSection / section.numberOfSubBeats)) % section.numberOfBeats;
                const currentSubBeat = counterRealtiveToSection % section.numberOfSubBeats;
                const currentBar = ~~(counterRealtiveToSection / (section.numberOfBeats * section.numberOfSubBeats));
                this.currentIndex = new Index(sectionIndex, currentBar, currentBeat, currentSubBeat, _counter, section.startOfSectionIndex, length);
                return;
            } else {
                count += length;
            }
        }
        this.currentIndex = Index.NotAnIndex();
    }

    constructor(song: SongType) {
        this.song = new Song(song);
        this.currentIndex = this.song.firstIndex();
    }

    public firstIndex(): Index {
        return this.song.firstIndex();
    }

    public lastIndex(): Index {
        return this.song.lastIndex();
    }

    public sectionAtIndex(index: Index): Section {
        return this.song.sections[index.section];
    }

    public currentSection(): Section | null {
        if (this.currentIndex.counter === -1) {
            return null;
        }
        return this.song.sections[this.currentIndex.section];
    }

    public numberOfBars(): number {
        return this.song.sections.reduce((value, section) => value + section.numberOfBars, 0);
    }
    
    public isSectionActive(section: Section): boolean {
        return this.currentSection()?.equals(section) ?? false;
    }

    public nextSection(): Index {
        if (this.currentIndex.isNotAnIndex()) {
            return this.song.firstIndex();
        } else { 
            return this.song.indexNextSection(this.currentIndex);
        }
    }

    public nextBarIndex(index: Index): Index {
        if (index.counter === -1) {
            return new Index(0, 0, 0, 0, 0, 0, 0);
        }
        if (index.section < 0 || index.section >= this.song.sections.length) {
            return new Index(-1, -1, -1, -1, -1, -1, -1);
        }
        const currentSection = this.song.sections[index.section];
        if (index.section === this.song.sections.length - 1 && index.bar === currentSection.numberOfBars - 1) {
            return new Index(-1, -1, -1, -1, -1, -1, -1);
        }
        return this.song.indexNextBar(index);
    }

    public next() {
        this.currentIndex = this.song.indexNextSubBeat(this.currentIndex);
    }

    public previousSection(): Index {
        return this.song.indexPreviousSection(this.currentIndex);
    }

    public previousBar(): Index {
        return this.song.indexPreviousBar(this.currentIndex);
    }

    public isSameSong(song: SongType): boolean {
        const s = new Song(song);
        return this.song.equals(s);
    }
}