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
exports.scheduleRoutes = exports.scheduleItemSelect = void 0;
var zod_1 = require("zod");
var client_1 = require("../../client");
var trpc_1 = require("../../trpc");
var response_1 = require("../../lib/response");
var validation_1 = require("./validation");
var client_2 = require("@prisma/client");
var validationV3_1 = require("./validationV3");
var schedule_service_1 = require("./schedule.service");
exports.scheduleItemSelect = {
    dish: {
        select: {
            id: true,
            name: true,
            items: {
                select: {
                    quantity: true,
                    food: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                }
            }
        }
    },
    food: {
        select: {
            id: true,
            name: true,
        }
    },
    customFoodName: true,
    id: true,
    quantity: true,
    time: true
};
exports.scheduleRoutes = {
    getSchedules: trpc_1.publicProcedure.input(zod_1.default.object({
        date: zod_1.default.string().datetime().optional(),
    })).query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var parsedDate, whereCondition, result;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    parsedDate = input.date ? new Date(input.date) : null;
                    whereCondition = parsedDate
                        ? {
                            date: {
                                gte: new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1), // start of month
                                lt: new Date(parsedDate.getFullYear(), parsedDate.getMonth() + 1, 1), // next month
                            },
                        }
                        : undefined;
                    return [4 /*yield*/, client_1.prisma.schedule.findMany({
                            select: {
                                id: true,
                                date: true,
                                dailyEvents: true,
                                items: {
                                    select: exports.scheduleItemSelect
                                },
                            },
                            where: whereCondition
                        })];
                case 1:
                    result = _c.sent();
                    return [2 /*return*/, (0, response_1.createResponseObject)(200, 'good', result)];
            }
        });
    }); }),
    getOneSchedule: trpc_1.publicProcedure.input(zod_1.default.union([
        zod_1.default.object({ id: zod_1.default.number(), date: zod_1.default.string().datetime().optional() }),
        zod_1.default.object({ id: zod_1.default.number().optional(), date: zod_1.default.string().datetime() }),
    ])).query(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var whereCondition, result, error_1;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    whereCondition = __assign({ id: input.id }, (input.date ? { date: input.date } : {}));
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, client_1.prisma.schedule.findFirst({
                            select: {
                                id: true,
                                dailyEvents: true,
                                date: true,
                                items: {
                                    select: exports.scheduleItemSelect
                                },
                            },
                            where: whereCondition
                        })];
                case 2:
                    result = _c.sent();
                    if (!result) {
                        return [2 /*return*/, (0, response_1.createResponseObject)(404, "Schedule not found", null)];
                    }
                    return [2 /*return*/, (0, response_1.createResponseObject)(200, "OK", result)];
                case 3:
                    error_1 = _c.sent();
                    if (error_1 instanceof client_2.Prisma.PrismaClientKnownRequestError) {
                        return [2 /*return*/, (0, response_1.createResponseObject)(400, "Database error", null)];
                    }
                    return [2 /*return*/, (0, response_1.createResponseObject)(500, "Unexpected error", null)];
                case 4: return [2 /*return*/];
            }
        });
    }); }),
    addSchedule: trpc_1.publicProcedure
        .input(validation_1.ScheduleCreateInputZod)
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var _c, dailyEvents, date, _d, items, result, error_2;
        var input = _b.input;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _c = input.dailyEvents, dailyEvents = _c === void 0 ? null : _c, date = input.date, _d = input.items, items = _d === void 0 ? [] : _d;
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, client_1.prisma.schedule.create({
                            data: {
                                date: date,
                                items: items ? { create: items } : undefined,
                                userId: 1,
                                dailyEvents: dailyEvents ? JSON.stringify(dailyEvents) : null
                            }, select: {
                                id: true,
                                items: {
                                    select: exports.scheduleItemSelect
                                },
                                date: true,
                                dailyEvents: true,
                            }
                        })];
                case 2:
                    result = _e.sent();
                    if (!result) {
                        return [2 /*return*/, (0, response_1.createResponseObject)(404, "hz", null)];
                    }
                    return [2 /*return*/, (0, response_1.createResponseObject)(200, "OK", result)];
                case 3:
                    error_2 = _e.sent();
                    if (error_2 instanceof client_2.Prisma.PrismaClientKnownRequestError) {
                        return [2 /*return*/, (0, response_1.createResponseObject)(400, "Database error", null)];
                    }
                    return [2 /*return*/, (0, response_1.createResponseObject)(500, "Unexpected error", null)];
                case 4: return [2 /*return*/];
            }
        });
    }); }),
    updateScheduleDailyEvents: trpc_1.publicProcedure.input(validation_1.DailyEventsUpdateSchema).mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var id, items, result, error_3;
        var input = _b.input;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    id = input.id, items = input.items;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, client_1.prisma.schedule.update({
                            where: { id: id },
                            select: {
                                date: true,
                                id: true,
                                dailyEvents: true,
                            },
                            data: {
                                dailyEvents: JSON.stringify(items)
                            }
                        })];
                case 2:
                    result = _c.sent();
                    if (!result) {
                        return [2 /*return*/, (0, response_1.createResponseObject)(404, "hz", null)];
                    }
                    return [2 /*return*/, (0, response_1.createResponseObject)(200, "OK", result)];
                case 3:
                    error_3 = _c.sent();
                    if (error_3 instanceof client_2.Prisma.PrismaClientKnownRequestError) {
                        return [2 /*return*/, (0, response_1.createResponseObject)(400, "Database error", null)];
                    }
                    return [2 /*return*/, (0, response_1.createResponseObject)(500, "Unexpected error", null)];
                case 4: return [2 /*return*/];
            }
        });
    }); }),
    updateSchedule: trpc_1.publicProcedure
        .input(validation_1.ScheduleUpdateInputZod)
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var id, date, changes, data, result, error_4;
        var _c, _d, _e;
        var input = _b.input;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    id = input.id, date = input.date, changes = input.changes;
                    data = {};
                    if (date)
                        data.date = date;
                    if (changes) {
                        data.items = {
                            create: (_c = changes.create) !== null && _c !== void 0 ? _c : [],
                            update: ((_d = changes.update) !== null && _d !== void 0 ? _d : []).map(function (u) {
                                var updateData = {};
                                if (u.quantity !== undefined)
                                    updateData.quantity = u.quantity;
                                if (u.time !== undefined)
                                    updateData.time = u.time;
                                // If customFoodName is provided
                                if (u.customFoodName !== undefined) {
                                    updateData.customFoodName = u.customFoodName;
                                    // Unlink dish and product if custom name is set
                                    updateData.dishId = null;
                                    updateData.foodId = null;
                                }
                                else {
                                    // Otherwise update them normally if explicitly provided
                                    if (u.dishId !== undefined)
                                        updateData.dishId = u.dishId;
                                    if (u.foodId !== undefined)
                                        updateData.foodId = u.foodId;
                                }
                                return {
                                    where: { id: u.id },
                                    data: updateData,
                                };
                            }),
                            delete: ((_e = changes.delete) !== null && _e !== void 0 ? _e : []).map(function (id) { return ({ id: id }); }),
                        };
                    }
                    if (input.dailyEvents) {
                        data.dailyEvents = JSON.stringify(input.dailyEvents);
                    }
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, client_1.prisma.schedule.update({
                            where: { id: id },
                            data: data,
                            select: {
                                id: true,
                                date: true,
                                dailyEvents: true,
                                items: { select: exports.scheduleItemSelect },
                            },
                        })];
                case 2:
                    result = _f.sent();
                    if (!result) {
                        return [2 /*return*/, (0, response_1.createResponseObject)(404, "hz", null)];
                    }
                    return [2 /*return*/, (0, response_1.createResponseObject)(200, "OK", result)];
                case 3:
                    error_4 = _f.sent();
                    if (error_4 instanceof client_2.Prisma.PrismaClientKnownRequestError) {
                        return [2 /*return*/, (0, response_1.createResponseObject)(400, "Database error", null)];
                    }
                    return [2 /*return*/, (0, response_1.createResponseObject)(500, "Unexpected error", null)];
                case 4: return [2 /*return*/];
            }
        });
    }); }),
    syncSchedule: trpc_1.publicProcedure
        .input(validationV3_1.ScheduleSyncInputZod)
        .mutation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var results, _loop_1, _i, _c, schedule;
        var input = _b.input;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    results = [];
                    _loop_1 = function (schedule) {
                        var result, error_5;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    _e.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, client_1.prisma.$transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                                            var existingSchedule, changes, eventChanges, _i, _a, item, _b, _c, item;
                                            var _d, _e, _f, _g, _h, _j;
                                            return __generator(this, function (_k) {
                                                switch (_k.label) {
                                                    case 0: return [4 /*yield*/, tx.schedule.findUnique({
                                                            where: { id: schedule.id },
                                                        })];
                                                    case 1:
                                                        existingSchedule = _k.sent();
                                                        if (!existingSchedule) return [3 /*break*/, 3];
                                                        return [4 /*yield*/, tx.schedule.update({
                                                                where: { id: schedule.id },
                                                                data: {
                                                                    updatedAt: new Date(),
                                                                },
                                                            })];
                                                    case 2:
                                                        _k.sent();
                                                        return [3 /*break*/, 5];
                                                    case 3: return [4 /*yield*/, tx.schedule.create({
                                                            data: {
                                                                id: schedule.id, // client-first id
                                                                userId: schedule.userId,
                                                            },
                                                        })];
                                                    case 4:
                                                        existingSchedule = _k.sent();
                                                        _k.label = 5;
                                                    case 5:
                                                        changes = schedule.items;
                                                        eventChanges = schedule.events;
                                                        if (!((_d = eventChanges === null || eventChanges === void 0 ? void 0 : eventChanges.delete) === null || _d === void 0 ? void 0 : _d.length)) return [3 /*break*/, 7];
                                                        return [4 /*yield*/, tx.scheduleEvent.deleteMany({
                                                                where: {
                                                                    id: { in: eventChanges.delete },
                                                                    scheduleId: schedule.id,
                                                                },
                                                            })];
                                                    case 6:
                                                        _k.sent();
                                                        _k.label = 7;
                                                    case 7:
                                                        if (!((_e = eventChanges === null || eventChanges === void 0 ? void 0 : eventChanges.update) === null || _e === void 0 ? void 0 : _e.length)) return [3 /*break*/, 11];
                                                        _i = 0, _a = eventChanges.update;
                                                        _k.label = 8;
                                                    case 8:
                                                        if (!(_i < _a.length)) return [3 /*break*/, 11];
                                                        item = _a[_i];
                                                        return [4 /*yield*/, tx.scheduleEvent.update({
                                                                where: { id: item.id },
                                                                data: {
                                                                    time: item.time,
                                                                },
                                                            })];
                                                    case 9:
                                                        _k.sent();
                                                        _k.label = 10;
                                                    case 10:
                                                        _i++;
                                                        return [3 /*break*/, 8];
                                                    case 11:
                                                        if (!((_f = eventChanges === null || eventChanges === void 0 ? void 0 : eventChanges.create) === null || _f === void 0 ? void 0 : _f.length)) return [3 /*break*/, 13];
                                                        return [4 /*yield*/, tx.scheduleEvent.createMany({
                                                                data: eventChanges.create.map(function (item) { return ({
                                                                    id: item.id,
                                                                    scheduleId: schedule.id,
                                                                    time: item.time,
                                                                }); }),
                                                                skipDuplicates: true,
                                                            })];
                                                    case 12:
                                                        _k.sent();
                                                        _k.label = 13;
                                                    case 13:
                                                        if (!((_g = changes === null || changes === void 0 ? void 0 : changes.delete) === null || _g === void 0 ? void 0 : _g.length)) return [3 /*break*/, 15];
                                                        return [4 /*yield*/, tx.scheduleItem.deleteMany({
                                                                where: {
                                                                    id: { in: changes.delete },
                                                                    scheduleId: schedule.id,
                                                                },
                                                            })];
                                                    case 14:
                                                        _k.sent();
                                                        _k.label = 15;
                                                    case 15:
                                                        if (!((_h = changes === null || changes === void 0 ? void 0 : changes.update) === null || _h === void 0 ? void 0 : _h.length)) return [3 /*break*/, 19];
                                                        _b = 0, _c = changes.update;
                                                        _k.label = 16;
                                                    case 16:
                                                        if (!(_b < _c.length)) return [3 /*break*/, 19];
                                                        item = _c[_b];
                                                        return [4 /*yield*/, tx.scheduleItem.update({
                                                                where: { id: item.id },
                                                                data: __assign({ time: item.time }, (0, schedule_service_1.mapScheduleItemData)(item)),
                                                            })];
                                                    case 17:
                                                        _k.sent();
                                                        _k.label = 18;
                                                    case 18:
                                                        _b++;
                                                        return [3 /*break*/, 16];
                                                    case 19:
                                                        if (!((_j = changes === null || changes === void 0 ? void 0 : changes.create) === null || _j === void 0 ? void 0 : _j.length)) return [3 /*break*/, 21];
                                                        return [4 /*yield*/, tx.scheduleItem.createMany({
                                                                data: changes.create.map(function (item) { return (__assign({ id: item.id, scheduleId: schedule.id, time: item.time }, (0, schedule_service_1.mapScheduleItemData)(item))); }),
                                                                skipDuplicates: true,
                                                            })];
                                                    case 20:
                                                        _k.sent();
                                                        _k.label = 21;
                                                    case 21: return [2 /*return*/, tx.schedule.findUnique({
                                                            where: { id: schedule.id },
                                                            include: {
                                                                items: true,
                                                            },
                                                        })];
                                                }
                                            });
                                        }); })];
                                case 1:
                                    result = _e.sent();
                                    results.push({
                                        id: schedule.id,
                                        schedule: result,
                                    });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_5 = _e.sent();
                                    console.error("Schedule sync error:", {
                                        scheduleId: schedule.id,
                                        error: error_5,
                                    });
                                    results.push({
                                        id: schedule.id,
                                        schedule: null,
                                    });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, _c = input.schedules;
                    _d.label = 1;
                case 1:
                    if (!(_i < _c.length)) return [3 /*break*/, 4];
                    schedule = _c[_i];
                    return [5 /*yield**/, _loop_1(schedule)];
                case 2:
                    _d.sent();
                    _d.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, (0, response_1.createResponseObject)(200, "OK", results)];
            }
        });
    }); })
};
