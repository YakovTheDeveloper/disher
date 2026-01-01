"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dihesRoutes = void 0;
var zod_1 = require("zod");
var client_1 = require("../../client");
var trpc_1 = require("../../trpc");
var response_1 = require("../../lib/response");
var dish_validation_1 = require("./dish.validation");
exports.dihesRoutes = {
    getDishes: trpc_1.publicProcedure
        .input(zod_1.default.object({
        page: zod_1.default.number().min(1).default(1),
        limit: zod_1.default.number().min(1).max(100).default(50),
        filters: zod_1.default
            .object({
            search: zod_1.default.string().optional(),
            // userId: z.number().optional(), // optional user filter if needed
        })
            .optional(),
    }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page, limit, filters, where, _c, items, total, hasMore, result;
        var input = _b.input;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    page = input.page, limit = input.limit, filters = input.filters;
                    where = {};
                    // if (filters?.userId) where.user = { id: filters.userId }
                    where.user = { id: 1 };
                    if (filters === null || filters === void 0 ? void 0 : filters.search)
                        where.name = { contains: filters.search, mode: 'insensitive' };
                    return [4 /*yield*/, Promise.all([
                            client_1.prisma.dish.findMany({
                                where: where,
                                skip: (page - 1) * limit,
                                take: limit,
                                select: dishSelect,
                                orderBy: { id: 'asc' },
                            }),
                            client_1.prisma.dish.count({ where: where }),
                        ])];
                case 1:
                    _c = _d.sent(), items = _c[0], total = _c[1];
                    hasMore = page * limit < total;
                    result = {
                        items: items,
                        hasMore: hasMore,
                    };
                    return [2 /*return*/, (0, response_1.createResponseObject)(200, 'good', result)];
            }
        });
    }); }),
    getDish: trpc_1.publicProcedure
        .input(zod_1.default.object({
        id: zod_1.default.union([
            zod_1.default.string(),
            zod_1.default.array(zod_1.default.string()),
        ]),
    }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var ids, result;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    ids = Array.isArray(input.id) ? input.id : [input.id];
                    return [4 /*yield*/, client_1.prisma.dish.findMany({
                            where: {
                                id: { in: ids },
                            },
                            select: {
                                id: true,
                                items: true,
                                name: true,
                            },
                        })];
                case 1:
                    result = _c.sent();
                    return [2 /*return*/, (0, response_1.createResponseObject)(200, 'good', result)];
            }
        });
    }); }),
    syncDish: trpc_1.publicProcedure
        .input(dish_validation_1.DishSyncInputZod)
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var results, notSync, _loop_1, _i, _c, dish;
        var input = _b.input, ctx = _b.ctx;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    results = [];
                    notSync = [];
                    _loop_1 = function (dish) {
                        var result, error_1;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    _e.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, client_1.prisma.$transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                                            var existingDish, changes, _i, _a, item;
                                            var _b, _c, _d, _e, _f;
                                            return __generator(this, function (_g) {
                                                switch (_g.label) {
                                                    case 0: return [4 /*yield*/, client_1.prisma.dish.findUnique({
                                                            where: { id: dish.id },
                                                        })];
                                                    case 1:
                                                        existingDish = _g.sent();
                                                        if (!existingDish) return [3 /*break*/, 3];
                                                        return [4 /*yield*/, tx.dish.update({
                                                                where: { id: dish.id },
                                                                data: {
                                                                    name: dish.name,
                                                                    userId: dish.userId,
                                                                    updatedAt: new Date(),
                                                                },
                                                            })];
                                                    case 2:
                                                        _g.sent();
                                                        return [3 /*break*/, 5];
                                                    case 3: return [4 /*yield*/, tx.dish.create({
                                                            data: {
                                                                id: dish.id, // client-first id
                                                                name: dish.name,
                                                                userId: dish.userId,
                                                            },
                                                        })];
                                                    case 4:
                                                        existingDish = _g.sent();
                                                        _g.label = 5;
                                                    case 5:
                                                        changes = dish.items;
                                                        if (!((_b = changes === null || changes === void 0 ? void 0 : changes.delete) === null || _b === void 0 ? void 0 : _b.length)) return [3 /*break*/, 7];
                                                        return [4 /*yield*/, tx.dishItem.deleteMany({
                                                                where: {
                                                                    id: { in: changes.delete.map(function (id) { return id.toString(); }) },
                                                                    dishId: (_c = dish.id) === null || _c === void 0 ? void 0 : _c.toString(), // защита
                                                                },
                                                            })];
                                                    case 6:
                                                        _g.sent();
                                                        _g.label = 7;
                                                    case 7:
                                                        if (!((_d = changes === null || changes === void 0 ? void 0 : changes.update) === null || _d === void 0 ? void 0 : _d.length)) return [3 /*break*/, 11];
                                                        _i = 0, _a = changes.update;
                                                        _g.label = 8;
                                                    case 8:
                                                        if (!(_i < _a.length)) return [3 /*break*/, 11];
                                                        item = _a[_i];
                                                        return [4 /*yield*/, tx.dishItem.update({
                                                                where: { id: (_e = item.id) === null || _e === void 0 ? void 0 : _e.toString() },
                                                                data: {
                                                                    quantity: item.quantity,
                                                                    food: { connect: { id: item.foodId } }
                                                                },
                                                            })];
                                                    case 9:
                                                        _g.sent();
                                                        _g.label = 10;
                                                    case 10:
                                                        _i++;
                                                        return [3 /*break*/, 8];
                                                    case 11:
                                                        if (!((_f = changes === null || changes === void 0 ? void 0 : changes.create) === null || _f === void 0 ? void 0 : _f.length)) return [3 /*break*/, 13];
                                                        return [4 /*yield*/, tx.dishItem.createMany({
                                                                data: changes.create.map(function (item) { return ({
                                                                    id: item.id, // client-first id
                                                                    quantity: item.quantity,
                                                                    foodId: item.foodId,
                                                                    dishId: existingDish.id
                                                                }); }),
                                                                skipDuplicates: true, // важно для повторного sync
                                                            })];
                                                    case 12:
                                                        _g.sent();
                                                        _g.label = 13;
                                                    case 13: return [4 /*yield*/, tx.dish.findUnique({
                                                            where: { id: dish.id },
                                                            include: {
                                                                items: true,
                                                            },
                                                        })];
                                                    case 14: 
                                                    // =========================
                                                    // RETURN UPDATED DISH
                                                    // =========================
                                                    return [2 /*return*/, _g.sent()];
                                                }
                                            });
                                        }); })];
                                case 1:
                                    result = _e.sent();
                                    results.push({
                                        id: dish.id,
                                        dish: result,
                                    });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_1 = _e.sent();
                                    console.error("Dish sync error:", {
                                        dishId: dish.id,
                                        error: error_1,
                                    });
                                    notSync.push(dish.id);
                                    results.push({
                                        id: dish.id,
                                        dish: null,
                                    });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, _c = input.dishes;
                    _d.label = 1;
                case 1:
                    if (!(_i < _c.length)) return [3 /*break*/, 4];
                    dish = _c[_i];
                    return [5 /*yield**/, _loop_1(dish)];
                case 2:
                    _d.sent();
                    _d.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, (0, response_1.createResponseObject)(200, "OK", {
                        dishes: results,
                        notSyncIds: notSync
                    })];
            }
        });
    }); }),
};
