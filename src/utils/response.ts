export function jsonResponseStringArrayConcat(object: JSONResponse): JSONResponse {
    // Go though each key in the object.
    // If the value is an array of strings, join them into a string.
    // If the value is an object, call this function again.
    for (const key in object) {
        if (object[key] instanceof Array) {
            if ((object[key] as Array<any>).every(item => typeof item === 'string')) {
                object[key] = object[key].join('\n');
            }
        } else if (object[key] instanceof Object) {
            object[key] = jsonResponseStringArrayConcat(object[key]);
        }
    }
    return object
}