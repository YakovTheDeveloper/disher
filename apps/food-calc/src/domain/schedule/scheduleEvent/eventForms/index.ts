// ============================================================================
// EVENT FORMS - Main Public API
// Re-export all types, configs, and utilities
// ============================================================================

// Re-export all types
export * from './configs/types';

// Re-export validation functions
export { validateField, validateEventForm } from './configs/validation';

// Re-export serialization functions
export {
    getEventFormConfig,
    serializeEvent,
    deserializeEvent,
} from './configs/serialization';

// Re-export form registry
export { formRegistry } from './configs/registry';

// Re-export all form configurations
export { EVENT_FORMS } from './eventFormsMap';

// Re-export individual config modules for convenience
export * from './physical';
export * from './mental';
export * from './activity';
export * from './social';
export * from './notes';
export * from './work';
export * from './learning';
export * from './environment';
export * from './digital';
export * from './life-events';