import React from 'react';
import { EventSubtype } from '../../eventTypes';

/**
 * Ключ для регистрации формы по цепочке сабтипов
 * Формат: "type.subtype.grandchild" (join по '.')
 */
export type FormRegistryKey = string;

/**
 * Компонент формы для регистрации
 */
export type RegistryFormComponent = React.ComponentType<{
    /** Текущие значения формы */
    values: Record<string, any>;
    /** Колбэк изменения значения */
    onChange: (key: string, value: any) => void;
    /** Ошибки валидации */
    errors?: Record<string, string>;
}>;

/**
 * Регистр форм для специфичных сабтипов
 */
class FormRegistry {
    private registry = new Map<FormRegistryKey, RegistryFormComponent>();

    /**
     * Зарегистрировать форму для определённой цепочки сабтипов
     * @param key - ключ в формате "type.subtype.grandchild"
     * @param component - React компонент формы
     */
    register(key: FormRegistryKey, component: RegistryFormComponent): void {
        this.registry.set(key, component);
    }

    /**
     * Получить все формы для цепочки сабтипов
     * @param subtypeChain - массив выбранных сабтипов, например ['exercise', 'pushups']
     * @returns массив компонентов форм для всей цепочки
     */
    getForms(subtypeChain: EventSubtype[]): RegistryFormComponent[] {
        const forms: RegistryFormComponent[] = [];

        // Собираем все возможные ключи от полной цепочки до частичной
        // Например: ['activity', 'exercise', 'pushups'] -> ['activity.exercise.pushups', 'activity.exercise', 'activity']
        for (let i = subtypeChain.length; i > 0; i--) {
            const key = subtypeChain.slice(0, i).join('.');
            const component = this.registry.get(key);
            if (component) {
                forms.push(component);
            }
        }

        return forms;
    }

    get(key: FormRegistryKey): RegistryFormComponent | undefined {
        return this.registry.get(key);
    }

    has(key: FormRegistryKey): boolean {
        return this.registry.has(key);
    }

    unregister(key: FormRegistryKey): void {
        this.registry.delete(key);
    }

    clear(): void {
        this.registry.clear();
    }
}

export const formRegistry = new FormRegistry();

import { PushupsWidget } from '@/components/features/event/widgets/PushupsWidget';

formRegistry.register('activity.exercise.pushups', PushupsWidget);
// formRegistry.register('hydration.water.tracking', WaterIntakeWidget);
// formRegistry.register('medication.pill.dosage', MedicationDosageWidget);
