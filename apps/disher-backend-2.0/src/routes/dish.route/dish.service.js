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
exports.getCreateItems = getCreateItems;
exports.getUpdateItems = getUpdateItems;
function getCreateItems(items) {
    var _a = (items !== null && items !== void 0 ? items : {}).create, create = _a === void 0 ? [] : _a;
    return {
        create: create.map(function (i) { return ({
            id: i.id,
            quantity: i.quantity,
            food: { connect: { id: i.foodId } },
        }); }),
    };
}
function getUpdateItems(items) {
    var _a = items !== null && items !== void 0 ? items : {}, _b = _a.create, create = _b === void 0 ? [] : _b, _c = _a.update, update = _c === void 0 ? [] : _c, _d = _a.delete, del = _d === void 0 ? [] : _d;
    return {
        create: create.map(function (i) { return ({
            id: i.id,
            quantity: i.quantity,
            food: { connect: { id: i.foodId } },
        }); }),
        update: update.map(function (i) { return ({
            where: { id: i.id },
            data: __assign(__assign({}, (i.quantity !== undefined && { quantity: i.quantity })), (i.foodId !== undefined && { foodId: i.foodId })),
        }); }),
        delete: del.map(function (id) { return ({ id: id }); }),
    };
}
