/**
 * Creates a username from an email address.
 *
 * @note Removes the domain from the email address and lowercases the username.
 */
export function createUsernameFromEmail(email: string): string {
  return email.split('@')[0].toLowerCase();
}

/**
 * Creates a username from a user's name, optionally using a separator character between the first and last name.
 */
export function createUsernameFromName(name: string, separator = '.'): string {
  return name.split(' ').join(separator).toLowerCase();
}
