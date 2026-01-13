"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.foodRoutes = void 0;
var zod_1 = require("zod");
var client_1 = require("../../client");
var response_1 = require("../../lib/response");
var trpc_1 = require("../../trpc");
var validation_1 = require("./validation");
var pagination_1 = require("../../lib/pagination");
exports.foodRoutes = {
    getFoodByIds: trpc_1.publicProcedure.input(zod_1.z.object({
        ids: zod_1.z.array(zod_1.z.number()).optional(),
    }).optional()).query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var result;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, client_1.prisma.food.findMany(__assign({ select: {
                            id: true,
                            name: true,
                        } }, ((input === null || input === void 0 ? void 0 : input.ids) ? {
                        where: {
                            id: {
                                in: input.ids
                            }
                        }
                    } : {})))];
                case 1:
                    result = _c.sent();
                    return [2 /*return*/, (0, response_1.createResponseObject)(200, 'good', result)];
            }
        });
    }); }),
    getFood: trpc_1.publicProcedure
        .input(zod_1.z.object({
        page: zod_1.z.number().min(1).default(1),
        limit: zod_1.z.number().min(1).max(1000).default(50),
        filters: zod_1.z
            .object({
            category: zod_1.z.string().optional(),
            search: zod_1.z.string().optional(),
        })
            .optional(),
    }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page, limit, filters, where, result;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    page = input.page, limit = input.limit, filters = input.filters;
                    where = {};
                    if (filters === null || filters === void 0 ? void 0 : filters.category)
                        where.category = filters.category;
                    if (filters === null || filters === void 0 ? void 0 : filters.search)
                        where.name = { contains: filters.search, mode: "insensitive" };
                    return [4 /*yield*/, (0, pagination_1.paginate)({
                            prismaModel: client_1.prisma.food,
                            page: page,
                            limit: limit,
                            where: where,
                            select: { id: true, name: true },
                            orderBy: { id: "asc" },
                        })];
                case 1:
                    result = _c.sent();
                    return [2 /*return*/, (0, response_1.createResponseObject)(200, 'good', result)];
            }
        });
    }); }),
    getFoodWithNutrients: trpc_1.publicProcedure
        .input(zod_1.z.object({
        page: zod_1.z.number().min(1).default(1),
        limit: zod_1.z.number().min(1).max(1000).default(50),
    }))
        .query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page, limit, select, _c, items, total, resultItems, result;
        var input = _b.input;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    page = input.page, limit = input.limit;
                    select = {
                        id: true,
                        name: true,
                        description: true,
                        nutrients: {
                            select: {
                                nutrientId: true,
                                quantity: true,
                            }
                        }
                    };
                    return [4 /*yield*/, Promise.all([
                            client_1.prisma.food.findMany({
                                skip: (page - 1) * limit,
                                take: limit,
                                select: select,
                            }),
                            client_1.prisma.food.count(),
                        ])];
                case 1:
                    _c = _d.sent(), items = _c[0], total = _c[1];
                    resultItems = items.map(function (item) {
                        // const nutrients = item.nutrients.map(nutrient => ({
                        var nutrients = item.nutrients.map(function (nutrient) { return (__assign(__assign({}, nutrient), { nutrientId: nutrient.nutrientId.toString() })); });
                        // }))
                        return __assign(__assign({}, item), { id: item.id.toString(), description: item.description || '', nutrients: nutrients });
                    });
                    result = {
                        items: resultItems, // now strongly typed as TModel[]
                        hasMore: page * limit < total,
                        total: total
                    };
                    return [2 /*return*/, (0, response_1.createResponseObject)(200, 'good', result)];
            }
        });
    }); }),
    getFoodWithNutrientsByIds: trpc_1.publicProcedure.input(zod_1.z.object({
        ids: zod_1.z.array(zod_1.z.number()).optional(),
    }).optional()).query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var result;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, client_1.prisma.food.findMany(__assign({ select: {
                            id: true,
                            name: true,
                            nutrients: {
                                select: {
                                    nutrientId: true,
                                    quantity: true,
                                }
                            }
                        } }, ((input === null || input === void 0 ? void 0 : input.ids) ? {
                        where: {
                            id: {
                                in: input.ids
                            }
                        }
                    } : {})))];
                case 1:
                    result = _c.sent();
                    return [2 /*return*/, (0, response_1.createResponseObject)(200, 'good', result)];
            }
        });
    }); }),
    getOneFood: trpc_1.publicProcedure.input(zod_1.z.object({
        id: zod_1.z.number()
    })).query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var whereCondition, result;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    whereCondition = {
                        id: input.id
                    };
                    return [4 /*yield*/, client_1.prisma.food.findFirst({
                            select: {
                                id: true,
                                name: true,
                                nutrients: {
                                    select: {
                                        quantity: true,
                                        nutrientId: true
                                    }
                                }
                            },
                            where: whereCondition
                        })];
                case 1:
                    result = _c.sent();
                    return [2 /*return*/, (0, response_1.createResponseObject)(200, 'good', result)];
            }
        });
    }); }),
    addFood: trpc_1.publicProcedure
        .input(validation_1.AddFoodInputSchema)
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var maxId, newId, food, error_1;
        var _c, _d, _e;
        var input = _b.input;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, client_1.prisma.food.aggregate({ _max: { id: true } })];
                case 1:
                    maxId = _f.sent();
                    newId = ((_c = maxId._max.id) !== null && _c !== void 0 ? _c : 0) + 1;
                    _f.label = 2;
                case 2:
                    _f.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, client_1.prisma.food.create({
                            data: {
                                id: newId,
                                name: input.name,
                                nameEng: input.nameEng,
                                description: (_d = input.description) !== null && _d !== void 0 ? _d : "",
                                descriptionEng: (_e = input.descriptionEng) !== null && _e !== void 0 ? _e : "",
                                nutrients: {
                                    create: input.nutrients.map(function (n) { return ({
                                        quantity: n.value,
                                        nutrientId: n.id,
                                    }); }),
                                },
                            },
                            include: {
                                nutrients: {
                                    select: {
                                        quantity: true,
                                        nutrientId: true,
                                    },
                                },
                            },
                        })];
                case 3:
                    food = _f.sent();
                    return [2 /*return*/, (0, response_1.createResponseObject)(200, "Food created successfully", food)];
                case 4:
                    error_1 = _f.sent();
                    console.error("addFood error:", error_1);
                    return [2 /*return*/, (0, response_1.createResponseObject)(500, "Error creating food", error_1)];
                case 5: return [2 /*return*/];
            }
        });
    }); }),
};
