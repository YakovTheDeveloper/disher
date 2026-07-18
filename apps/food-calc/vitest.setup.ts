// Dexie is the app's store and touches indexedDB at module level, which jsdom has
// no implementation of — every suite that imports the schema needs this polyfill.
// (The comment here used to credit Triplit; Triplit left with the 2026-05-09
// zero-base pivot, and the polyfill stayed load-bearing for Dexie.)
import 'fake-indexeddb/auto';

// i18n is a side-effect init (lng: 'ru'). Without it `t()` returns the KEY, so a
// component test sees `placeholder="food.freeText.clarifyPlaceholder"` where the
// user sees «Что уточнить?» — the suite silently tests a string the app never
// renders. Two suites already imported this by hand; doing it here makes every
// component test match production instead of each one remembering.
import '@/app/i18n';
