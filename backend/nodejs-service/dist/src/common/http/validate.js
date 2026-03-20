"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
function validate(schema) {
    return (req, _res, next) => {
        const result = schema.parse({
            body: req.body,
            params: req.params,
            query: req.query
        });
        req.body = result.body;
        req.params = result.params;
        req.query = result.query;
        next();
    };
}
