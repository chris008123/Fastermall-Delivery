export const DELIVERY_CODE_LENGTH = 6;

// A 6-digit run that isn't part of a longer number (an order id, a phone number).
const STANDALONE_CODE = /(?<!\d)\d{6}(?!\d)/;
// A 6-digit run right after the word "code": "code is 123456", "Code: 123456".
const CODE_AFTER_WORD = /code\D{0,12}?(\d{6})(?!\d)/i;

/** Turns whatever lands in the code field into just the code. Pasting a whole
 * message keeps the right 6 digits: the ones after the word "code" if there
 * are any, else the first standalone 6-digit number. Anything else keeps its
 * digits, capped at 6. */
export function extractDeliveryCode(input: string): string {
  if (input.length > DELIVERY_CODE_LENGTH) {
    const afterWord = input.match(CODE_AFTER_WORD);
    if (afterWord) return afterWord[1];
    const standalone = input.match(STANDALONE_CODE);
    if (standalone) return standalone[0];
  }
  return input.replace(/[^0-9]/g, '').slice(0, DELIVERY_CODE_LENGTH);
}
