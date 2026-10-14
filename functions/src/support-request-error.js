/**
 * An expected rejection of a support request. The handler turns it into a JSON
 * response; any other error is treated as an unexpected server failure.
 */
export class SupportRequestError extends Error {
  /**
   * @param {string} code Error code the page maps to a translated message, e.g. `invalid_name`.
   * @param {number} httpStatus HTTP status sent with the error response.
   */
  constructor(code, httpStatus) {
    super(code);
    this.name = "SupportRequestError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
