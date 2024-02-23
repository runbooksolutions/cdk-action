export function jsonResponseStringArrayConcat(object: JSONResponse): JSONResponse {
    for (const key in object) {
        if (object[key] instanceof Array) {
            object[key] = object[key].join('\n');
        } else if (object[key] instanceof Object) {
            object[key] = JSON.stringify(jsonResponseStringArrayConcat(object[key]));
        }
    }
    return object
}