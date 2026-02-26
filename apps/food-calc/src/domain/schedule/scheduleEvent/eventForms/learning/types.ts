// ============================================================================
// LEARNING SUBTYPES AND TYPES
// ============================================================================

import { SubtypeOption } from '@/components/features/event/SubtypeTreeSelector';

/**
 * Древовидная структура подтипов обучения и творчества
 */
export const LEARNING_SUBTYPES_TREE: SubtypeOption[] = [
    {
        value: 'study_session',
        labelKey: 'subtype.learning.category.study_session',
        children: [
            { value: 'course', labelKey: 'subtype.learning.course' },
            { value: 'practice', labelKey: 'subtype.learning.practice' },
            { value: 'flashcards', labelKey: 'subtype.learning.flashcards' },
            { value: 'custom_study', labelKey: 'subtype.learning.custom_study' },
        ],
    },
    {
        value: 'reading',
        labelKey: 'subtype.learning.category.reading',
        children: [
            { value: 'book', labelKey: 'subtype.learning.book' },
            { value: 'article', labelKey: 'subtype.learning.article' },
            { value: 'paper', labelKey: 'subtype.learning.paper' },
            { value: 'custom_reading', labelKey: 'subtype.learning.custom_reading' },
        ],
    },
    {
        value: 'language',
        labelKey: 'subtype.learning.category.language',
        children: [
            { value: 'vocab', labelKey: 'subtype.learning.vocab' },
            { value: 'speaking', labelKey: 'subtype.learning.speaking' },
            { value: 'lesson', labelKey: 'subtype.learning.lesson' },
            { value: 'custom_language', labelKey: 'subtype.learning.custom_language' },
        ],
    },
    {
        value: 'writing_output',
        labelKey: 'subtype.learning.category.writing_output',
        children: [
            { value: 'journal_writing', labelKey: 'subtype.learning.journal_writing' },
            { value: 'blog_post', labelKey: 'subtype.learning.blog_post' },
            { value: 'notes_system', labelKey: 'subtype.learning.notes_system' },
            { value: 'custom_writing', labelKey: 'subtype.learning.custom_writing' },
        ],
    },
    {
        value: 'art_music',
        labelKey: 'subtype.learning.category.art_music',
        children: [
            { value: 'drawing', labelKey: 'subtype.learning.drawing' },
            { value: 'music_practice', labelKey: 'subtype.learning.music_practice' },
            { value: 'photo', labelKey: 'subtype.learning.photo' },
            { value: 'custom_art', labelKey: 'subtype.learning.custom_art' },
        ],
    },
    {
        value: 'building',
        labelKey: 'subtype.learning.category.building',
        children: [
            { value: 'side_project', labelKey: 'subtype.learning.side_project' },
            { value: 'craft', labelKey: 'subtype.learning.craft' },
            { value: 'maker', labelKey: 'subtype.learning.maker' },
            { value: 'custom_building', labelKey: 'subtype.learning.custom_building' },
        ],
    },
];

export type LearningSubtype =
    | 'course' | 'practice' | 'flashcards' | 'custom_study'
    | 'book' | 'article' | 'paper' | 'custom_reading'
    | 'vocab' | 'speaking' | 'lesson' | 'custom_language'
    | 'journal_writing' | 'blog_post' | 'notes_system' | 'custom_writing'
    | 'drawing' | 'music_practice' | 'photo' | 'custom_art'
    | 'side_project' | 'craft' | 'maker' | 'custom_building';
