export const DELIVERY_CODE_LENGTH = 6;

/** Turns whatever lands in the code field into just the code. Pasting a whole
 * message ("Your code is 123456") keeps the 6-digit run; anything else keeps
 * its digits, capped at 6. */
export function extractDeliveryCode(input: string): string {
  const run = input.length > DELIVERY_CODE_LENGTH ? input.match(/\d{6}/) : null;
  return run ? run[0] : input.replace(/[^0-9]/g, '').slice(0, DELIVERY_CODE_LENGTH);
}
