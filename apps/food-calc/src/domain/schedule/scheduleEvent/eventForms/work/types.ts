// ============================================================================
// WORK SUBTYPES AND TYPES
// ============================================================================

import { SubtypeOption } from '@/components/features/event/SubtypeTreeSelector';

/**
 * Древовидная структура подтипов работы
 */
export const WORK_SUBTYPES_TREE: SubtypeOption[] = [
    {
        value: 'deep_work',
        labelKey: 'subtype.work.category.deep_work',
        children: [
            { value: 'coding', labelKey: 'subtype.work.coding' },
            { value: 'writing', labelKey: 'subtype.work.writing' },
            { value: 'design', labelKey: 'subtype.work.design' },
            { value: 'analysis', labelKey: 'subtype.work.analysis' },
            { value: 'custom_deep', labelKey: 'subtype.work.custom_deep' },
        ],
    },
    {
        value: 'shallow_work',
        labelKey: 'subtype.work.category.shallow_work',
        children: [
            { value: 'email', labelKey: 'subtype.work.email' },
            { value: 'docs', labelKey: 'subtype.work.docs' },
            { value: 'triage', labelKey: 'subtype.work.triage' },
            { value: 'custom_shallow', labelKey: 'subtype.work.custom_shallow' },
        ],
    },
    {
        value: 'meetings',
        labelKey: 'subtype.work.category.meetings',
        children: [
            { value: 'sync', labelKey: 'subtype.work.sync' },
            { value: '1on1', labelKey: 'subtype.work.1on1' },
            { value: 'planning', labelKey: 'subtype.work.planning' },
            { value: 'retro', labelKey: 'subtype.work.retro' },
            { value: 'interview', labelKey: 'subtype.work.interview' },
            { value: 'custom_meeting', labelKey: 'subtype.work.custom_meeting' },
        ],
    },
    {
        value: 'delivery',
        labelKey: 'subtype.work.category.delivery',
        children: [
            { value: 'deploy', labelKey: 'subtype.work.deploy' },
            { value: 'incident', labelKey: 'subtype.work.incident' },
            { value: 'hotfix', labelKey: 'subtype.work.hotfix' },
            { value: 'oncall', labelKey: 'subtype.work.oncall' },
            { value: 'task_done', labelKey: 'subtype.work.task_done' },
            { value: 'blocked', labelKey: 'subtype.work.blocked' },
            { value: 'context_switching', labelKey: 'subtype.work.context_switching' },
            { value: 'custom_delivery', labelKey: 'subtype.work.custom_delivery' },
        ],
    },
    {
        value: 'career',
        labelKey: 'subtype.work.category.career',
        children: [
            { value: 'resume', labelKey: 'subtype.work.resume' },
            { value: 'portfolio', labelKey: 'subtype.work.portfolio' },
            { value: 'job_search', labelKey: 'subtype.work.job_search' },
            { value: 'offer', labelKey: 'subtype.work.offer' },
            { value: 'salary_talk', labelKey: 'subtype.work.salary_talk' },
            { value: 'custom_career', labelKey: 'subtype.work.custom_career' },
        ],
    },
];

export type WorkSubtype =
    | 'coding' | 'writing' | 'design' | 'analysis' | 'custom_deep'
    | 'email' | 'docs' | 'triage' | 'custom_shallow'
    | 'sync' | '1on1' | 'planning' | 'retro' | 'interview' | 'custom_meeting'
    | 'deploy' | 'incident' | 'hotfix' | 'oncall' | 'task_done' | 'blocked' | 'context_switching' | 'custom_delivery'
    | 'resume' | 'portfolio' | 'job_search' | 'offer' | 'salary_talk' | 'custom_career';
