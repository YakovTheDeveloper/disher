// Polyfill indexedDB for jsdom environment (Triplit client needs it at module level)
import 'fake-indexeddb/auto';

// Prevent Triplit client from triggering reload in tests
// (schema version mismatch causes window.location.reload on first import)
localStorage.setItem('triplit_schema_version', '5');
