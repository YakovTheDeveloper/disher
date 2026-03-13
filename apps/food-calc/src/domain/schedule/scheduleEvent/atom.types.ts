/**
 * Atomic Event Model
 * 
 * Events are composed of minimal, universal atoms instead of rigid types.
 * This allows flexible composition without schema constraints.
 */

/**
 * Scale Atom - For any 1-10 rating
 * 
 * Usage:
 * - Pain level, mood, energy, stress, anxiety, workload
 */
export interface ScaleAtom {
    kind: 'scale'
    value: number // 1-10
    label?: string // optional: "pain", "mood", "energy"
}

/**
 * Time Atom - For temporal parameters
 * 
 * Usage:
 * - Sleep duration, workout duration, appointment end time
 * - Can represent start + end, or duration
 */
export interface TimeAtom {
    kind: 'time'
    start?: number // timestamp in ms
    end?: number // timestamp in ms
    durationMin?: number // duration in minutes
}

/**
 * Number Atom - For any quantitative measurement
 * 
 * Usage:
 * - 5 km run, 120 bpm heart rate, 37.5°C temperature, 400mg medication, 8000 steps
 */
export interface NumberAtom {
    kind: 'number'
    value: number
    unit?: string // "km", "bpm", "°C", "mg", "steps", etc.
    label?: string // optional description
}

/**
 * Tag Atom - Universal marker for categories and statuses
 * 
 * Usage:
 * - Sport types: "running", "gym", "cycling", "yoga"
 * - Health: "fatigue", "headache", "blue mood", "focus"
 * - Work related: "meeting", "deadline", "presentation"
 * - Social: "friends", "family", "date"
 * - Any custom tag user wants
 * 
 * Replaces ALL category types (mood, stress, sport, illness, etc.)
 */
export interface TagAtom {
    kind: 'tag'
    value: string
}

/**
 * Relation Atom - Express causality or connection
 * 
 * Usage:
 * - "because work stress"
 * - "after heavy workout"
 * - "related to medication"
 * - "following bad sleep"
 */
export interface RelationAtom {
    kind: 'relation'
    value: string
}

/**
 * Flag Atom - Binary marker for states
 *
 * Usage:
 * - "important", "recurring", "chronic", "urgent"
 * - "needs follow-up", "medication needed"
 * - Any yes/no attribute
 */
export interface FlagAtom {
    kind: 'flag'
    value: string
}

/**
 * Body Point - exact location on body silhouette
 */
export interface BodyPoint {
    x: number // 0-1 normalized within body SVG viewBox
    y: number // 0-1 normalized within body SVG viewBox
    side: 'front' | 'back'
}

/**
 * Body Atom - Mark exact body location for pain/discomfort
 *
 * Usage:
 * - Pin exact pain point on body silhouette
 * - Multiple points can be placed on front/back
 */
export interface BodyAtom {
    kind: 'body'
    points: BodyPoint[]
    label?: string // e.g. "боль", "дискомфорт", "напряжение"
}

/**
 * Union type of all possible atoms
 */
export type Atom = ScaleAtom | TimeAtom | NumberAtom | TagAtom | RelationAtom | FlagAtom | BodyAtom

/**
 * Type guard functions for atoms
 */
export const isScaleAtom = (atom: Atom): atom is ScaleAtom => atom.kind === 'scale'
export const isTimeAtom = (atom: Atom): atom is TimeAtom => atom.kind === 'time'
export const isNumberAtom = (atom: Atom): atom is NumberAtom => atom.kind === 'number'
export const isTagAtom = (atom: Atom): atom is TagAtom => atom.kind === 'tag'
export const isRelationAtom = (atom: Atom): atom is RelationAtom => atom.kind === 'relation'
export const isFlagAtom = (atom: Atom): atom is FlagAtom => atom.kind === 'flag'
export const isBodyAtom = (atom: Atom): atom is BodyAtom => atom.kind === 'body'

/**
 * Event composed of atoms
 */
export interface Event {
    id: string
    text?: string // brief description of what happened
    createdAt: number // timestamp in ms
    atoms: Atom[]
}

/**
 * Validation helpers
 */
export function isValidScaleValue(value: any): value is number {
    return typeof value === 'number' && value >= 1 && value <= 10
}

export function isValidAtom(atom: any): atom is Atom {
    if (!atom || typeof atom !== 'object' || !atom.kind) {
        return false
    }

    const kind = atom.kind

    switch (kind) {
        case 'scale':
            return isValidScaleValue(atom.value)
        case 'time':
            return (
                typeof atom.start === 'number' ||
                typeof atom.end === 'number' ||
                typeof atom.durationMin === 'number'
            )
        case 'number':
            return typeof atom.value === 'number'
        case 'tag':
            return typeof atom.value === 'string' && atom.value.length > 0
        case 'relation':
            return typeof atom.value === 'string' && atom.value.length > 0
        case 'flag':
            return typeof atom.value === 'string' && atom.value.length > 0
        case 'body':
            return Array.isArray(atom.points) && atom.points.length > 0
        default:
            return false
    }
}

export function isValidEvent(event: any): event is Event {
    return (
        typeof event?.id === 'string' &&
        typeof event?.createdAt === 'number' &&
        Array.isArray(event?.atoms) &&
        event.atoms.every(isValidAtom)
    )
}
