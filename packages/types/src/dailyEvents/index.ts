type OneToTen = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type SleepEvent = {
    variant: 'sleep';
    content: {
        quality: OneToTen;
        hours: number;
        minutes: number;
    };
};

type MoodEvent = {
    variant: 'mood';
    content: {
        value: OneToTen;
    };
};

type EnergyEvent = {
    variant: 'energy';
    content: {
        value: OneToTen;
    };
};

type DigestionEvent = {
    variant: 'digestion';
    content: {
        variant:
        | 'bloating'
        | 'stomach_pain'
        | 'heartburn'
        | 'constipation'
        | 'diarrhea';
        value: OneToTen;
    };
};

type ActivityEvent = {
    variant: 'activity';
    content: {
        variant: string;
        hours: number;
        minutes: number;
    };
};

type NoteEvent = {
    variant: 'note';
    content: {
        value: string;
    };
};

export type DailyEventData =
    | SleepEvent
    | MoodEvent
    | EnergyEvent
    | DigestionEvent
    | ActivityEvent
    | NoteEvent;


