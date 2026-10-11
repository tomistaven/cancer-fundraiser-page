export class SupportRequestError extends Error {
  constructor(code, httpStatus) {
    super(code);
    this.name = "SupportRequestError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
