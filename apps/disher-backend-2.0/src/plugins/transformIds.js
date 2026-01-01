"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformIds = transformIds;
exports.parseIds = parseIds;
function transformIds(value, seen) {
    if (seen === void 0) { seen = new WeakSet(); }
    if (value === null || typeof value !== "object")
        return value;
    if (seen.has(value))
        return value;
    seen.add(value);
    if (Array.isArray(value)) {
        return value.map(function (v) { return transformIds(v, seen); });
    }
    // only plain objects, skip Fastify/tRPC/Prisma internals
    if (Object.getPrototypeOf(value) !== Object.prototype) {
        return value;
    }
    var out = {};
    for (var _i = 0, _a = Object.keys(value); _i < _a.length; _i++) {
        var key = _a[_i];
        var v = value[key];
        // match: id, userId, postId, commentId, parentId, categoryId ...
        var isIdField = key === "id" || key.endsWith("Id");
        if (isIdField && typeof v === "number") {
            out[key] = String(v);
        }
        else {
            out[key] = transformIds(v, seen);
        }
    }
    return out;
}
function parseIds(obj) {
    if (Array.isArray(obj))
        return obj.map(parseIds);
    if (obj && typeof obj === 'object') {
        return Object.fromEntries(Object.entries(obj).map(function (_a) {
            var k = _a[0], v = _a[1];
            return [
                k,
                k.endsWith('Id') && typeof v === 'string' ? Number(v) : parseIds(v),
            ];
        }));
    }
    return obj;
}
