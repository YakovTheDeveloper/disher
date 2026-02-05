import { EventFormConfig } from '../configs/types';
import { SubtypeOption } from '@/components/features/event/SubtypeTreeSelector';

/**
 * Иерархическая структура подтипов активности для tree-компонента
 * Построена по принципу: Индустрия (Категория) -> Конкретное действие
 */
export const ACTIVITY_SUBTYPES_TREE: SubtypeOption[] = [
    {
        value: 'basic_mobility',
        labelKey: 'subtype.activity.category.basic_mobility',
        children: [
            { value: 'walking', labelKey: 'subtype.activity.walking' },
            { value: 'steps', labelKey: 'subtype.activity.steps' },
            { value: 'light_stretching', labelKey: 'subtype.activity.light_stretching' },
            { value: 'joint_gymnastics', labelKey: 'subtype.activity.joint_gymnastics' },
            { value: 'morning_exercise', labelKey: 'subtype.activity.morning_exercise' },
        ],
    },
    {
        value: 'fitness_gym',
        labelKey: 'subtype.activity.category.fitness_gym',
        children: [
            { value: 'strength_training', labelKey: 'subtype.activity.strength_training' },
            { value: 'cardio', labelKey: 'subtype.activity.cardio' },
            { value: 'crossfit', labelKey: 'subtype.activity.crossfit' },
            { value: 'bodyweight', labelKey: 'subtype.activity.bodyweight' },
            { value: 'home_workout', labelKey: 'subtype.activity.home_workout' },
            { value: 'hiit', labelKey: 'subtype.activity.hiit' },
        ],
    },
    {
        value: 'mind_and_body',
        labelKey: 'subtype.activity.category.mind_and_body',
        children: [
            { value: 'yoga', labelKey: 'subtype.activity.yoga' },
            { value: 'pilates', labelKey: 'subtype.activity.pilates' },
            { value: 'meditation', labelKey: 'subtype.activity.meditation' },
            { value: 'breathing_practice', labelKey: 'subtype.activity.breathing_practice' },
            { value: 'qigong', labelKey: 'subtype.activity.qigong' },
            { value: 'stretching', labelKey: 'subtype.activity.stretching' },
        ],
    },
    {
        value: 'cyclic_sports',
        labelKey: 'subtype.activity.category.cyclic_sports',
        children: [
            { value: 'running', labelKey: 'subtype.activity.running' },
            { value: 'cycling', labelKey: 'subtype.activity.cycling' },
            { value: 'swimming', labelKey: 'subtype.activity.swimming' },
            { value: 'nordic_walking', labelKey: 'subtype.activity.nordic_walking' },
            { value: 'skiing', labelKey: 'subtype.activity.skiing' },
            { value: 'rowing', labelKey: 'subtype.activity.rowing' },
        ],
    },
    {
        value: 'team_and_games',
        labelKey: 'subtype.activity.category.team_and_games',
        children: [
            { value: 'football', labelKey: 'subtype.activity.football' },
            { value: 'basketball', labelKey: 'subtype.activity.basketball' },
            { value: 'volleyball', labelKey: 'subtype.activity.volleyball' },
            { value: 'tennis', labelKey: 'subtype.activity.tennis' },
            { value: 'badminton', labelKey: 'subtype.activity.badminton' },
            { value: 'table_tennis', labelKey: 'subtype.activity.table_tennis' },
        ],
    },
    {
        value: 'martial_arts',
        labelKey: 'subtype.activity.category.martial_arts',
        children: [
            { value: 'boxing', labelKey: 'subtype.activity.boxing' },
            { value: 'karate_taekwondo', labelKey: 'subtype.activity.karate_taekwondo' },
            { value: 'bjj_wrestling', labelKey: 'subtype.activity.bjj_wrestling' },
            { value: 'muay_thai', labelKey: 'subtype.activity.muay_thai' },
        ],
    },
    {
        value: 'active_recreation',
        labelKey: 'subtype.activity.category.active_recreation',
        children: [
            { value: 'dancing', labelKey: 'subtype.activity.dancing' },
            { value: 'hiking', labelKey: 'subtype.activity.hiking' },
            { value: 'skating', labelKey: 'subtype.activity.skating' },
            { value: 'horse_riding', labelKey: 'subtype.activity.horse_riding' },
            { value: 'climbing', labelKey: 'subtype.activity.climbing' },
        ],
    },
    {
        value: 'daily_routine',
        labelKey: 'subtype.activity.category.daily_routine',
        children: [
            { value: 'housework', labelKey: 'subtype.activity.housework' },
            { value: 'gardening', labelKey: 'subtype.activity.gardening' },
            { value: 'shopping', labelKey: 'subtype.activity.shopping' },
            { value: 'playing_with_kids', labelKey: 'subtype.activity.playing_with_kids' },
        ],
    },
];

export const activityConfig: EventFormConfig = {
    eventType: 'activity',
    fields: [
        {
            key: 'subtype',
            type: 'tree',
            labelKey: 'field.activity.subtype',
            options: ACTIVITY_SUBTYPES_TREE,
            validation: { required: true, errorMessage: 'Выберите тип активности' },
            maxDepth: 2,
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.activity.duration',
            validation: { min: 0, max: 24, required: true, errorMessage: 'Укажите время' },
            defaultValue: '00:30',
        },
        {
            key: 'intensity',
            type: 'slider',
            labelKey: 'field.activity.intensity',
            validation: { min: 1, max: 10, required: false },
            defaultValue: 5,
        },
        {
            key: 'well-being',
            type: 'slider',
            labelKey: 'field.activity.well_being',
            validation: { min: 1, max: 10, required: false },
            defaultValue: 7,
            advanced: false, // Выводим сразу, важно для осознанности
        },
        // {
        //     key: 'comment',
        //     type: 'textarea',
        //     labelKey: 'field.activity.comment',
        //     validation: { maxLength: 300 },
        //     advanced: true,
        // },
    ],
    serializedFields: ['subtype', 'duration', 'intensity', 'well-being', 'comment'],
};