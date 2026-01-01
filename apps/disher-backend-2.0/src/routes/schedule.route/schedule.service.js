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
exports.mapScheduleItemData = mapScheduleItemData;
exports.syncSchedule = syncSchedule;
var schedule_route_1 = require("./schedule.route");
function mapScheduleItemData(item) {
    var _a, _b, _c;
    var content = item.content;
    switch (content.variant) {
        case "food":
            if (!content.foodId) {
                throw new Error("foodId is required for variant 'food'");
            }
            return {
                quantity: (_a = item.quantity) !== null && _a !== void 0 ? _a : 0,
                type: "food",
                foodId: +content.foodId,
                dishId: null,
                customFoodName: null,
            };
        case "dish":
            if (!content.dishId) {
                throw new Error("dishId is required for variant 'dish'");
            }
            return {
                quantity: (_b = item.quantity) !== null && _b !== void 0 ? _b : 0,
                type: "dish",
                dishId: content.dishId,
                foodId: null,
                customFoodName: null,
            };
        case "custom":
            if (!content.customName) {
                throw new Error("customName is required for variant 'custom'");
            }
            return {
                quantity: (_c = item.quantity) !== null && _c !== void 0 ? _c : 0,
                type: "custom",
                customFoodName: content.customName,
                foodId: null,
                dishId: null,
            };
        default:
            throw new Error("Invalid variant in content");
    }
}
function syncSchedule(tx, schedule // you can type with DayScheduleInput
) {
    return __awaiter(this, void 0, void 0, function () {
        var date, dailyEvents, items, isDraft, userId, data;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            date = schedule.date, dailyEvents = schedule.dailyEvents, items = schedule.items, isDraft = schedule.isDraft, userId = schedule.userId;
            data = { userId: userId };
            if (date)
                data.date = date;
            if (dailyEvents)
                data.dailyEvents = JSON.stringify(dailyEvents);
            // Transform nested items (create/update/delete)
            if (items) {
                data.items = {
                    create: ((_a = items.create) !== null && _a !== void 0 ? _a : []).map(function (u) {
                        var base = {
                            quantity: u.quantity,
                            time: u.time,
                            type: u.content.type,
                        };
                        switch (u.content.type) {
                            case "custom":
                                return __assign(__assign({}, base), { customFoodName: u.content.name, dishId: null, foodId: null });
                            case "dish":
                                return __assign(__assign({}, base), { dishId: u.content.dishId, foodId: null, customFoodName: null });
                            case "food":
                                return __assign(__assign({}, base), { foodId: u.content.foodId, dishId: null, customFoodName: null });
                        }
                        return base;
                    }),
                    update: ((_b = items.update) !== null && _b !== void 0 ? _b : []).map(function (u) {
                        var updateData = {};
                        if (u.quantity !== undefined)
                            updateData.quantity = u.quantity;
                        if (u.time !== undefined)
                            updateData.time = u.time;
                        if (u.content) {
                            switch (u.content.type) {
                                case "custom":
                                    updateData.customFoodName = u.content.name;
                                    updateData.dishId = null;
                                    updateData.foodId = null;
                                    break;
                                case "dish":
                                    updateData.dishId = u.content.dishId;
                                    updateData.foodId = null;
                                    updateData.customFoodName = null;
                                    break;
                                case "food":
                                    updateData.foodId = u.content.foodId;
                                    updateData.dishId = null;
                                    updateData.customFoodName = null;
                                    break;
                            }
                        }
                        return {
                            where: { id: u.id },
                            data: updateData,
                        };
                    }),
                    delete: ((_c = items.delete) !== null && _c !== void 0 ? _c : []).map(function (id) { return ({ id: id }); }),
                };
            }
            // Create or update schedule
            if (isDraft) {
                console.log(__assign(__assign({}, data), { items: { create: (_e = (_d = data.items) === null || _d === void 0 ? void 0 : _d.create) !== null && _e !== void 0 ? _e : [] } }));
                return [2 /*return*/, tx.schedule.create({
                        data: __assign(__assign({}, data), { items: { create: (_g = (_f = data.items) === null || _f === void 0 ? void 0 : _f.create) !== null && _g !== void 0 ? _g : [] } }),
                        select: {
                            id: true,
                            date: true,
                            dailyEvents: true,
                            items: { select: schedule_route_1.scheduleItemSelect },
                        },
                    })];
            }
            return [2 /*return*/, tx.schedule.update({
                    where: { date: date },
                    data: data,
                    select: {
                        id: true,
                        date: true,
                        dailyEvents: true,
                        items: { select: schedule_route_1.scheduleItemSelect },
                    },
                })];
        });
    });
}
