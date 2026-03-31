import { Events, makeSchema, Schema, State } from '@livestore/livestore'

// ─── Events (synced) ────────────────────────────────────────────────────────

// Products (ex-foods)
const productCreated = Events.synced({
  name: 'v1.ProductCreated',
  schema: Schema.Struct({
    id: Schema.String,
    userId: Schema.String,
    name: Schema.String,
    nameEng: Schema.String,
    description: Schema.optionalWith(Schema.String, { default: () => '' }),
    descriptionEng: Schema.optionalWith(Schema.String, { default: () => '' }),
    source: Schema.optionalWith(Schema.String, { default: () => '' }),
    pricePerKg: Schema.optionalWith(Schema.Number, { default: () => 0 }),
    nutrients: Schema.optionalWith(Schema.String, { default: () => '{}' }), // JSON: Record<nutrientId, quantity>
    portions: Schema.optionalWith(Schema.String, { default: () => '[]' }), // JSON: Array<{label, amount, unit, grams}>
    categories: Schema.optionalWith(Schema.String, { default: () => '[]' }), // JSON: string[]
  }),
})

const productUpdated = Events.synced({
  name: 'v1.ProductUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.optional(Schema.String),
    nameEng: Schema.optional(Schema.String),
    description: Schema.optional(Schema.String),
    descriptionEng: Schema.optional(Schema.String),
    pricePerKg: Schema.optional(Schema.Number),
    nutrients: Schema.optional(Schema.String),
    portions: Schema.optional(Schema.String),
    categories: Schema.optional(Schema.String),
  }),
})

const productDeleted = Events.synced({
  name: 'v1.ProductDeleted',
  schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Number }),
})

// Dishes
const dishCreated = Events.synced({
  name: 'v1.DishCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    userId: Schema.String,
    createdAt: Schema.Number,
  }),
})

const dishUpdated = Events.synced({
  name: 'v1.DishUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.optional(Schema.String),
    updatedAt: Schema.Number,
  }),
})

const dishDeleted = Events.synced({
  name: 'v1.DishDeleted',
  schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Number }),
})

// Dish Items
const dishItemCreated = Events.synced({
  name: 'v1.DishItemCreated',
  schema: Schema.Struct({
    id: Schema.String,
    dishId: Schema.String,
    foodId: Schema.String,
    quantity: Schema.Number,
    userId: Schema.String,
  }),
})

const dishItemUpdated = Events.synced({
  name: 'v1.DishItemUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    foodId: Schema.optional(Schema.String),
    quantity: Schema.optional(Schema.Number),
  }),
})

const dishItemDeleted = Events.synced({
  name: 'v1.DishItemDeleted',
  schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Number }),
})

// Dish Portions
const dishPortionCreated = Events.synced({
  name: 'v1.DishPortionCreated',
  schema: Schema.Struct({
    id: Schema.String,
    dishId: Schema.String,
    userId: Schema.String,
    label: Schema.String,
    amount: Schema.Number,
    unit: Schema.String,
    grams: Schema.Number,
  }),
})

const dishPortionUpdated = Events.synced({
  name: 'v1.DishPortionUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    label: Schema.optional(Schema.String),
    amount: Schema.optional(Schema.Number),
    unit: Schema.optional(Schema.String),
    grams: Schema.optional(Schema.Number),
  }),
})

const dishPortionDeleted = Events.synced({
  name: 'v1.DishPortionDeleted',
  schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Number }),
})

// Schedule Foods
const scheduleFoodCreated = Events.synced({
  name: 'v1.ScheduleFoodCreated',
  schema: Schema.Struct({
    id: Schema.String,
    date: Schema.String,
    userId: Schema.String,
    quantity: Schema.Number,
    type: Schema.String, // 'food' | 'dish'
    time: Schema.String,
    details: Schema.optionalWith(Schema.String, { default: () => '' }),
    foodId: Schema.optionalWith(Schema.String, { default: () => '' }),
    dishId: Schema.optionalWith(Schema.String, { default: () => '' }),
  }),
})

const scheduleFoodUpdated = Events.synced({
  name: 'v1.ScheduleFoodUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    time: Schema.optional(Schema.String),
    quantity: Schema.optional(Schema.Number),
    details: Schema.optional(Schema.String),
    foodId: Schema.optional(Schema.String),
    dishId: Schema.optional(Schema.String),
    type: Schema.optional(Schema.String),
  }),
})

const scheduleFoodDeleted = Events.synced({
  name: 'v1.ScheduleFoodDeleted',
  schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Number }),
})

// Schedule Events
const scheduleEventCreated = Events.synced({
  name: 'v1.ScheduleEventCreated',
  schema: Schema.Struct({
    id: Schema.String,
    date: Schema.String,
    userId: Schema.String,
    time: Schema.String,
    endTime: Schema.optionalWith(Schema.String, { default: () => '' }),
    text: Schema.optionalWith(Schema.String, { default: () => '' }),
    atoms: Schema.optionalWith(Schema.String, { default: () => '[]' }), // JSON: Atom[]
  }),
})

const scheduleEventUpdated = Events.synced({
  name: 'v1.ScheduleEventUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    time: Schema.optional(Schema.String),
    endTime: Schema.optional(Schema.String),
    text: Schema.optional(Schema.String),
    atoms: Schema.optional(Schema.String),
  }),
})

const scheduleEventDeleted = Events.synced({
  name: 'v1.ScheduleEventDeleted',
  schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Number }),
})

// Daily Norms
const dailyNormCreated = Events.synced({
  name: 'v1.DailyNormCreated',
  schema: Schema.Struct({
    id: Schema.String,
    userId: Schema.String,
    name: Schema.String,
    description: Schema.optionalWith(Schema.String, { default: () => '' }),
    items: Schema.optionalWith(Schema.String, { default: () => '{}' }), // JSON: Record<nutrientId, quantity>
  }),
})

const dailyNormUpdated = Events.synced({
  name: 'v1.DailyNormUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.optional(Schema.String),
    description: Schema.optional(Schema.String),
    items: Schema.optional(Schema.String),
  }),
})

const dailyNormDeleted = Events.synced({
  name: 'v1.DailyNormDeleted',
  schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Number }),
})

// Periods
const periodCreated = Events.synced({
  name: 'v1.PeriodCreated',
  schema: Schema.Struct({
    id: Schema.String,
    userId: Schema.String,
    name: Schema.String,
    description: Schema.optionalWith(Schema.String, { default: () => '' }),
    startDate: Schema.String,
    endDate: Schema.String,
    colorIndex: Schema.optionalWith(Schema.Number, { default: () => 0 }),
    createdAt: Schema.Number,
  }),
})

const periodUpdated = Events.synced({
  name: 'v1.PeriodUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.optional(Schema.String),
    description: Schema.optional(Schema.String),
    startDate: Schema.optional(Schema.String),
    endDate: Schema.optional(Schema.String),
    colorIndex: Schema.optional(Schema.Number),
  }),
})

const periodDeleted = Events.synced({
  name: 'v1.PeriodDeleted',
  schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Number }),
})

// ─── All events ─────────────────────────────────────────────────────────────

export const events = {
  productCreated,
  productUpdated,
  productDeleted,
  dishCreated,
  dishUpdated,
  dishDeleted,
  dishItemCreated,
  dishItemUpdated,
  dishItemDeleted,
  dishPortionCreated,
  dishPortionUpdated,
  dishPortionDeleted,
  scheduleFoodCreated,
  scheduleFoodUpdated,
  scheduleFoodDeleted,
  scheduleEventCreated,
  scheduleEventUpdated,
  scheduleEventDeleted,
  dailyNormCreated,
  dailyNormUpdated,
  dailyNormDeleted,
  periodCreated,
  periodUpdated,
  periodDeleted,
}

// ─── Tables (read model) ───────────────────────────────────────────────────

const products = State.SQLite.table({
  name: 'products',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    userId: State.SQLite.text(),
    name: State.SQLite.text(),
    nameEng: State.SQLite.text({ default: '' }),
    description: State.SQLite.text({ default: '' }),
    descriptionEng: State.SQLite.text({ default: '' }),
    source: State.SQLite.text({ default: '' }),
    pricePerKg: State.SQLite.real({ default: 0 }),
    nutrients: State.SQLite.text({ default: '{}' }),
    portions: State.SQLite.text({ default: '[]' }),
    categories: State.SQLite.text({ default: '[]' }),
    deletedAt: State.SQLite.integer({ nullable: true }),
  },
})

const dishes = State.SQLite.table({
  name: 'dishes',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text(),
    userId: State.SQLite.text(),
    createdAt: State.SQLite.integer({ nullable: true }),
    updatedAt: State.SQLite.integer({ nullable: true }),
    deletedAt: State.SQLite.integer({ nullable: true }),
  },
})

const dishItems = State.SQLite.table({
  name: 'dish_items',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    dishId: State.SQLite.text(),
    productId: State.SQLite.text(),
    quantity: State.SQLite.real(),
    userId: State.SQLite.text(),
    deletedAt: State.SQLite.integer({ nullable: true }),
  },
})

const dishPortions = State.SQLite.table({
  name: 'dish_portions',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    dishId: State.SQLite.text(),
    userId: State.SQLite.text(),
    label: State.SQLite.text(),
    amount: State.SQLite.real(),
    unit: State.SQLite.text(),
    grams: State.SQLite.real(),
    deletedAt: State.SQLite.integer({ nullable: true }),
  },
})

const scheduleFoods = State.SQLite.table({
  name: 'schedule_foods',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    date: State.SQLite.text(),
    userId: State.SQLite.text(),
    quantity: State.SQLite.real(),
    type: State.SQLite.text(), // 'food' | 'dish'
    time: State.SQLite.text(),
    details: State.SQLite.text({ default: '' }),
    productId: State.SQLite.text({ default: '' }),
    dishId: State.SQLite.text({ default: '' }),
    deletedAt: State.SQLite.integer({ nullable: true }),
  },
})

const scheduleEvents = State.SQLite.table({
  name: 'schedule_events',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    date: State.SQLite.text(),
    userId: State.SQLite.text(),
    time: State.SQLite.text(),
    endTime: State.SQLite.text({ default: '' }),
    text: State.SQLite.text({ default: '' }),
    atoms: State.SQLite.text({ default: '[]' }),
    deletedAt: State.SQLite.integer({ nullable: true }),
  },
})

const dailyNorms = State.SQLite.table({
  name: 'daily_norms',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    userId: State.SQLite.text(),
    name: State.SQLite.text(),
    description: State.SQLite.text({ default: '' }),
    items: State.SQLite.text({ default: '{}' }),
    deletedAt: State.SQLite.integer({ nullable: true }),
  },
})

const periods = State.SQLite.table({
  name: 'periods',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    userId: State.SQLite.text(),
    name: State.SQLite.text(),
    description: State.SQLite.text({ default: '' }),
    startDate: State.SQLite.text(),
    endDate: State.SQLite.text(),
    colorIndex: State.SQLite.integer({ default: 0 }),
    createdAt: State.SQLite.integer({ nullable: true }),
    deletedAt: State.SQLite.integer({ nullable: true }),
  },
})

export const tables = {
  products,
  dishes,
  dishItems,
  dishPortions,
  scheduleFoods,
  scheduleEvents,
  dailyNorms,
  periods,
}

// ─── Materializers ─────────────────────────────────────────────────────────

const materializers = State.SQLite.materializers(events, {
  // Products
  'v1.ProductCreated': ({ id, userId, name, nameEng, description, descriptionEng, source, pricePerKg, nutrients, portions, categories }) =>
    tables.products.insert({ id, userId, name, nameEng, description, descriptionEng, source, pricePerKg, nutrients, portions, categories }).onConflict('id', 'ignore'),
  'v1.ProductUpdated': ({ id, ...fields }) =>
    tables.products.update(fields).where({ id }),
  'v1.ProductDeleted': ({ id, deletedAt }) =>
    tables.products.update({ deletedAt }).where({ id }),

  // Dishes
  'v1.DishCreated': ({ id, name, userId, createdAt }) =>
    tables.dishes.insert({ id, name, userId, createdAt, updatedAt: createdAt }),
  'v1.DishUpdated': ({ id, updatedAt, ...fields }) =>
    tables.dishes.update({ ...fields, updatedAt }).where({ id }),
  'v1.DishDeleted': ({ id, deletedAt }) =>
    tables.dishes.update({ deletedAt }).where({ id }),

  // Dish Items
  'v1.DishItemCreated': ({ id, dishId, foodId, quantity, userId }) =>
    tables.dishItems.insert({ id, dishId, productId: foodId, quantity, userId }),
  'v1.DishItemUpdated': ({ id, ...fields }) =>
    tables.dishItems.update(fields).where({ id }),
  'v1.DishItemDeleted': ({ id, deletedAt }) =>
    tables.dishItems.update({ deletedAt }).where({ id }),

  // Dish Portions
  'v1.DishPortionCreated': ({ id, dishId, userId, label, amount, unit, grams }) =>
    tables.dishPortions.insert({ id, dishId, userId, label, amount, unit, grams }),
  'v1.DishPortionUpdated': ({ id, ...fields }) =>
    tables.dishPortions.update(fields).where({ id }),
  'v1.DishPortionDeleted': ({ id, deletedAt }) =>
    tables.dishPortions.update({ deletedAt }).where({ id }),

  // Schedule Foods
  'v1.ScheduleFoodCreated': ({ id, date, userId, quantity, type, time, details, foodId, dishId }) =>
    tables.scheduleFoods.insert({ id, date, userId, quantity, type, time, details, productId: foodId, dishId }),
  'v1.ScheduleFoodUpdated': ({ id, ...fields }) =>
    tables.scheduleFoods.update(fields).where({ id }),
  'v1.ScheduleFoodDeleted': ({ id, deletedAt }) =>
    tables.scheduleFoods.update({ deletedAt }).where({ id }),

  // Schedule Events
  'v1.ScheduleEventCreated': ({ id, date, userId, time, endTime, text, atoms }) =>
    tables.scheduleEvents.insert({ id, date, userId, time, endTime, text, atoms }),
  'v1.ScheduleEventUpdated': ({ id, ...fields }) =>
    tables.scheduleEvents.update(fields).where({ id }),
  'v1.ScheduleEventDeleted': ({ id, deletedAt }) =>
    tables.scheduleEvents.update({ deletedAt }).where({ id }),

  // Daily Norms
  'v1.DailyNormCreated': ({ id, userId, name, description, items }) =>
    tables.dailyNorms.insert({ id, userId, name, description, items }).onConflict('id', 'ignore'),
  'v1.DailyNormUpdated': ({ id, ...fields }) =>
    tables.dailyNorms.update(fields).where({ id }),
  'v1.DailyNormDeleted': ({ id, deletedAt }) =>
    tables.dailyNorms.update({ deletedAt }).where({ id }),

  // Periods
  'v1.PeriodCreated': ({ id, userId, name, description, startDate, endDate, colorIndex, createdAt }) =>
    tables.periods.insert({ id, userId, name, description, startDate, endDate, colorIndex, createdAt }),
  'v1.PeriodUpdated': ({ id, ...fields }) =>
    tables.periods.update(fields).where({ id }),
  'v1.PeriodDeleted': ({ id, deletedAt }) =>
    tables.periods.update({ deletedAt }).where({ id }),
})

// ─── State & Schema ────────────────────────────────────────────────────────

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })
