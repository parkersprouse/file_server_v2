/* eslint-disable @typescript-eslint/no-explicit-any -- these are utilities for broadly checking any type of value */

export type ObjectLiteral = { [key: string | number | symbol]: any; };

/**
 * Checks whether or not the two provided arguments have the same value, taking arrays and objects
 *   into consideration to ensure they're checked more accurately.
 *
 * @param {any} [a] The first value to use in the equality check.
 * @param {any} [b] The second value to use in the equality check.
 * @returns {boolean} Whether or not the two provided arguments have the same value.
 */
export function areEqual(a: any, b: any): boolean {
  try {
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      const a_flat = a.flat(Number.POSITIVE_INFINITY);
      const b_flat = b.flat(Number.POSITIVE_INFINITY);
      const differences = [
        ...a_flat.filter((x) => !b_flat.includes(x)),
        ...b_flat.filter((x) => !a_flat.includes(x)),
      ];
      return differences.length === 0;
    }

    if (isObjectLiteral(a) && isObjectLiteral(b)) {
      return JSON.stringify(sortObject(a)) === JSON.stringify(sortObject(b));
    }

    return a === b;
  } catch {
    return false;
  }
}

/**
 * Checks if the provided `value` is "empty" - i.e. contains no values.
 * In order for a value to have the possibility of being "empty," it has to have countable elements.
 * This leaves us with three valid data types:
 *   - Arrays
 *   - Object Literals
 *   - Strings
 *
 * @param {any} [value] The value to be checked if empty.
 * @returns {boolean | undefined} Whether or not the provided value is empty, or `undefined` if the value `#isNil()`
 */
export function isEmpty(value: any): boolean | undefined {
  if (isNil(value)) return undefined;
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
  if (isObjectLiteral(value)) return Object.entries(value).length === 0;
  return undefined;
}

/**
 * Checks if the provided `value` is `null` or `undefined`, also known as `nil`.
 *
 * @param {any} [value] The value to be checked if can be parsed as as number.
 * @returns {boolean} Whether or not the provided value is `null` or `undefined`.
 */
export function isNil(value: any): value is null | undefined {
  return value === null || value === undefined || typeof value === 'undefined';
}

/**
 * Checks if the provided `value` is *not* `null` or `undefined`.
 *
 * @param {any} [value] The value to be checked.
 * @returns {boolean} Whether or not the provided value is *not* `null` or `undefined`.
 */
export function hasValue(value: any): boolean {
  return !isNil(value);
}

/**
 * Determines whether or not a `value` is a `number` by parsing it as a `number` and then comparing
 *   the `result` to the original `value`.
 *
 * If `result` is not `NaN`, and `value` === `result`, then the provided `value` is a `number`.
 * Otherwise, it is not.
 *
 * @param {any} [value] The value to be checked as numeric.
 * @returns {boolean} Whether or not the provided value is a `number`.
 */
export function isNumber(value: any): value is number {
  try {
    const parsed = Number(value);
    return !Number.isNaN(parsed) && parsed === value;
  } catch {
    return false;
  }
}

/**
 * Checks if the provided `value` is an object literal (was instantiated as `{}` or `new Object()`)
 *
 * @param {any} [value] The value to be checked as an object literal.
 * @returns {boolean} Whether or not the provided value is an object literal.
 */
export function isObjectLiteral(value: any): value is ObjectLiteral {
  if (value === null || value === undefined || typeof value !== 'object') return false;
  return value.constructor === Object &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(value), 'constructor') &&
    // I know this is confusing with the `!`, but it's correct because object literals inherit their constructors
    !Object.prototype.hasOwnProperty.call(value, 'constructor');
}

/**
 *
 * @param {string} [email] The email we want to test for validity
 * @returns {boolean} Whether or not the email is valid
 */
export function isValidEmail(email: string): boolean {
  const email_regex = /^[a-zA-Z0-9]+([-._+][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
  return email_regex.test(email);
}

/**
 * @param {any} [value] The value to be checked if can be parsed as as `number`.
 * @returns {boolean} Whether or not the provided value can be parsed to a `number`.
 */
export function parsableNumber(value: any): value is number {
  try {
    if (isNil(value)) return false;
    return isNumber(Number(value));
  } catch {
    return false;
  }
}

/**
 * Creates a copy of the provided `ObjectLiteral` with its keys sorted.
 * @NOTE Currently only works on root-level keys - does not yet work recursively.
 * @TODO Make this sort recursively.
 *
 * @param {ObjectLiteral} [object] The object we want to sort the keys of.
 * @returns {ObjectLiteral} A copy of the object with its keys sorted.
 */
export function sortObject(object: ObjectLiteral): ObjectLiteral {
  if (!isObjectLiteral(object) || isEmpty(object)) return {};
  const clone = { ...object };
  return Object
    .keys(clone)
    .sort((a, b) => {
      const first = toString(a).toLocaleLowerCase();
      const second = toString(b).toLocaleLowerCase();
      return first.localeCompare(second, 'en', {
        ignorePunctuation: true,
        numeric: true,
      });
    })
    .reduce(
      (obj: ObjectLiteral, key) => {
        obj[key] = clone[key];
        return obj;
      },
      {},
    );
}

/**
 * @param {any} [value] The value we want to convert to a `number`.
 * @returns {number} The value converted to a `number`, or `NaN` if the value cannot be converted.
 */
export function toNumber(value: any): number {
  try {
    if (isNil(value)) return Number.NaN;
    return Number(value);
  } catch {
    return Number.NaN;
  }
}

/**
 * @param {any} [value] The value we want to convert to a `string`.
 * @returns {string} The value converted to a `string`, falling back to an empty string on failure.
 */
export function toString(value: any): string {
  try {
    if (isNil(value) || isEmpty(value)) return '';
    if (isObjectLiteral(value)) return JSON.stringify(value);
    return value.toString();
  } catch {
    return '';
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */
