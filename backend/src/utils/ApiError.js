/** Error carrying an HTTP status code, thrown by controllers and services. */
export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message, errors) {
    return new ApiError(400, message, errors);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message, errors) {
    return new ApiError(409, message, errors);
  }
}
