import { Schema as S, Roles } from "@triplit/client";

// Roles: JWT "sub" claim maps to userId
export const roles: Roles = {
  user: {
    match: {
      sub: "$userId",
    },
  },
};

export const schema = S.Collections({
  // ─── Users ───
  users: {
    schema: S.Schema({
      id: S.Id(),
      name: S.String({ nullable: true, default: null }),
      email: S.String({ nullable: true, default: null }),
      image: S.String({ nullable: true, default: null }),
      createdAt: S.Date({ default: S.Default.now() }),
      updatedAt: S.Date({ default: S.Default.now() }),
    }),
    relationships: {
      scheduleFoods: S.RelationMany("scheduleFoods", {
        where: [["userId", "=", "$id"]],
      }),
      scheduleEvents: S.RelationMany("scheduleEvents", {
        where: [["userId", "=", "$id"]],
      }),
      dishes: S.RelationMany("dishes", {
        where: [["userId", "=", "$id"]],
      }),
      dailyNorms: S.RelationMany("dailyNorms", {
        where: [["userId", "=", "$id"]],
      }),
      accounts: S.RelationMany("accounts", {
        where: [["userId", "=", "$id"]],
      }),
    },
    permissions: {
      user: {
        read: { filter: [["id", "=", "$role.userId"]] },
        update: { filter: [["id", "=", "$role.userId"]] },
      },
    },
  },

  // ─── Schedule Events ───
  // Events are atom-based: each event has a text + an array of typed atoms (scale, time, number, tag, etc.)
  scheduleEvents: {
    schema: S.Schema({
      id: S.Id(),
      date: S.String(), // "DD-MM-YYYY"
      userId: S.String(),
      time: S.String(),
      text: S.String({ default: "" }),
      createdAt: S.Date({ default: S.Default.now() }),
      atoms: S.Json(), // Atom[] — see atom.types.ts on frontend
    }),
    permissions: {
      user: {
        read: { filter: [["userId", "=", "$role.userId"]] },
        insert: { filter: [["userId", "=", "$role.userId"]] },
        update: { filter: [["userId", "=", "$role.userId"]] },
        delete: { filter: [["userId", "=", "$role.userId"]] },
      },
    },
  },

  // ─── Schedule Foods ───
  scheduleFoods: {
    schema: S.Schema({
      id: S.Id(),
      date: S.String(), // "DD-MM-YYYY"
      userId: S.String(),
      quantity: S.Number(),
      type: S.String({ enum: ["food", "dish"] }),
      time: S.String(),
      foodId: S.String({ nullable: true, default: null }),
      dishId: S.String({ nullable: true, default: null }),
    }),
    relationships: {
      food: S.RelationById("foods", "$foodId"),
      dish: S.RelationById("dishes", "$dishId"),
    },
    permissions: {
      user: {
        read: { filter: [["userId", "=", "$role.userId"]] },
        insert: { filter: [["userId", "=", "$role.userId"]] },
        update: { filter: [["userId", "=", "$role.userId"]] },
        delete: { filter: [["userId", "=", "$role.userId"]] },
      },
    },
  },

  // ─── Foods ───
  // Reference data: readable by all authenticated users
  foods: {
    schema: S.Schema({
      id: S.Id(),
      name: S.String(),
      nameEng: S.String(),
      description: S.String({ nullable: true, default: null }),
      descriptionEng: S.String({ nullable: true, default: null }),
    }),
    relationships: {
      nutrients: S.RelationMany("foodNutrients", {
        where: [["foodId", "=", "$id"]],
      }),
    },
    permissions: {
      user: {
        read: { filter: [true] },
      },
    },
  },

  // ─── Food Nutrients ───
  foodNutrients: {
    schema: S.Schema({
      id: S.Id(),
      quantity: S.Number(),
      foodId: S.String(),
      nutrientId: S.String(),
    }),
    relationships: {
      food: S.RelationById("foods", "$foodId"),
      nutrient: S.RelationById("nutrients", "$nutrientId"),
    },
    permissions: {
      user: {
        read: { filter: [true] },
      },
    },
  },

  // ─── Nutrients ───
  nutrients: {
    schema: S.Schema({
      id: S.Id(),
      name: S.String({ nullable: true, default: null }),
      nameEng: S.String({ nullable: true, default: null }),
      unit: S.String({ nullable: true, default: null }),
      unitEng: S.String({ nullable: true, default: null }),
      displayName: S.String({ nullable: true, default: null }),
      displayNameEng: S.String({ nullable: true, default: null }),
    }),
    permissions: {
      user: {
        read: { filter: [true] },
      },
    },
  },

  // ─── Dishes ───
  dishes: {
    schema: S.Schema({
      id: S.Id(),
      name: S.String(),
      userId: S.String(),
      createdAt: S.Date({ default: S.Default.now() }),
      updatedAt: S.Date({ default: S.Default.now() }),
    }),
    relationships: {
      user: S.RelationById("users", "$userId"),
      items: S.RelationMany("dishItems", {
        where: [["dishId", "=", "$id"]],
      }),
    },
    permissions: {
      user: {
        read: { filter: [["userId", "=", "$role.userId"]] },
        insert: { filter: [["userId", "=", "$role.userId"]] },
        update: { filter: [["userId", "=", "$role.userId"]] },
        delete: { filter: [["userId", "=", "$role.userId"]] },
      },
    },
  },

  // ─── Dish Items ───
  dishItems: {
    schema: S.Schema({
      id: S.Id(),
      quantity: S.Number(),
      foodId: S.String(),
      dishId: S.String(),
      userId: S.String(), // denormalized for permissions
    }),
    relationships: {
      food: S.RelationById("foods", "$foodId"),
      dish: S.RelationById("dishes", "$dishId"),
    },
    permissions: {
      user: {
        read: { filter: [["userId", "=", "$role.userId"]] },
        insert: { filter: [["userId", "=", "$role.userId"]] },
        update: { filter: [["userId", "=", "$role.userId"]] },
        delete: { filter: [["userId", "=", "$role.userId"]] },
      },
    },
  },

  // ─── Daily Norms ───
  dailyNorms: {
    schema: S.Schema({
      id: S.Id(),
      userId: S.String(),
      name: S.String(),
      description: S.String(),
    }),
    relationships: {
      user: S.RelationById("users", "$userId"),
      items: S.RelationMany("dailyNormItems", {
        where: [["normId", "=", "$id"]],
      }),
    },
    permissions: {
      user: {
        read: { filter: [["userId", "=", "$role.userId"]] },
        insert: { filter: [["userId", "=", "$role.userId"]] },
        update: { filter: [["userId", "=", "$role.userId"]] },
        delete: { filter: [["userId", "=", "$role.userId"]] },
      },
    },
  },

  // ─── Daily Norm Items ───
  dailyNormItems: {
    schema: S.Schema({
      id: S.Id(),
      normId: S.String(),
      nutrientId: S.String(),
      quantity: S.Number({ nullable: true, default: null }),
      userId: S.String(), // denormalized for permissions
    }),
    relationships: {
      norm: S.RelationById("dailyNorms", "$normId"),
      nutrient: S.RelationById("nutrients", "$nutrientId"),
    },
    permissions: {
      user: {
        read: { filter: [["userId", "=", "$role.userId"]] },
        insert: { filter: [["userId", "=", "$role.userId"]] },
        update: { filter: [["userId", "=", "$role.userId"]] },
        delete: { filter: [["userId", "=", "$role.userId"]] },
      },
    },
  },

  // ─── Accounts (OAuth) ───
  accounts: {
    schema: S.Schema({
      id: S.Id(),
      userId: S.String(),
      type: S.String(),
      provider: S.String(),
      providerAccountId: S.String(),
      refresh_token: S.String({ nullable: true, default: null }),
      access_token: S.String({ nullable: true, default: null }),
      expires_at: S.Number({ nullable: true, default: null }),
      token_type: S.String({ nullable: true, default: null }),
      scope: S.String({ nullable: true, default: null }),
      id_token: S.String({ nullable: true, default: null }),
      session_state: S.String({ nullable: true, default: null }),
    }),
    relationships: {
      user: S.RelationById("users", "$userId"),
    },
    permissions: {
      user: {
        read: { filter: [["userId", "=", "$role.userId"]] },
        insert: { filter: [["userId", "=", "$role.userId"]] },
      },
    },
  },
});
