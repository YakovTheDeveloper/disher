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
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
var schedule_route_1 = require("./schedule.route/schedule.route");
var trpc_1 = require("../trpc");
var user_route_1 = require("./user.route");
var dish_route_1 = require("./dish.route/dish.route");
var food_route_1 = require("./food.route/food.route");
var questionnaire_route_1 = require("./questionnaire.route/questionnaire.route");
var norm_route_1 = require("./norm.route/norm.route");
exports.appRouter = trpc_1.t.router(__assign(__assign(__assign(__assign(__assign(__assign({}, schedule_route_1.scheduleRoutes), user_route_1.userRoutes), dish_route_1.dihesRoutes), food_route_1.foodRoutes), questionnaire_route_1.questionnaireRoute), norm_route_1.dailyNormRoute));
