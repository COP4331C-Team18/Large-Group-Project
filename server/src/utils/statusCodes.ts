// enum for status codes
export enum HTTPStatusCodes {
    OK = 200, // success
    CREATED = 201, // resource created (ex: user created. board created, etc.)
    BAD_REQUEST = 400, // client error (incorrect payload, missing fields, etc.)
    UNAUTHORIZED = 401, // unauthorized (incorrect credentials, invalid token, etc.)
    FORBIDDEN = 403, // forbidden ( unverified email )
    NOT_FOUND = 404, // not found
    CONFLICT = 409, // conflict (duplicate username/email, etc.)
    INTERNAL_SERVER_ERROR = 500 // internal server error
}