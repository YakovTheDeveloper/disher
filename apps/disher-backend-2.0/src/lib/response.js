"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponseObject = createResponseObject;
function createResponseObject(responseCode, message, data) {
    return {
        code: responseCode,
        nonce: Date.now(),
        message: message,
        data: data
    };
}
