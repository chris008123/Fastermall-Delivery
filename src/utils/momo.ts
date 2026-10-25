/** Mobile-money number rules, kept free of any app imports so they can be
 * tested on their own. Ghana numbers: a leading 0 plus nine digits. */
export const isValidMomoNumber = (value: string) => /^0\d{9}$/.test(value);

/** "0241234567" -> "024 ··· 4567" */
export const maskMomoNumber = (value: string) => `${value.slice(0, 3)} ··· ${value.slice(-4)}`;

/** What the number field keeps while typing or pasting: digits only, at most 10. */
export const sanitizeMomoInput = (value: string) => value.replace(/\D/g, '').slice(0, 10);
