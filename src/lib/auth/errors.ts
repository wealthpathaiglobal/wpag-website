/**
 * WPAG Authorization Errors
 */

export class AuthenticationError extends Error {
  constructor(message = "Authentication required.") {
    super(message);

    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message = "Insufficient permissions.") {
    super(message);

    this.name = "AuthorizationError";
  }
}