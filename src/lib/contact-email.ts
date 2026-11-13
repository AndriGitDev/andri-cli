/** Basic contact-form syntax, with bounded work for untrusted JSON values. */
export function isValidContactEmail(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 254) return false;

  const at = value.indexOf('@');
  if (at < 1 || at !== value.lastIndexOf('@') || /\s/u.test(value)) return false;

  // Preserve the forms' basic dotted-domain check without overlapping regex
  // quantifiers. A dot must have at least one domain character on either side.
  const domain = value.slice(at + 1);
  return domain.length >= 3 && domain.slice(1, -1).includes('.');
}
