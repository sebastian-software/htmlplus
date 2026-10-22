// Hand-authored format profiles checked against Swift's IBAN Registry, release 103.
// This preview deliberately supports this subset, not every registered country.
export const ibanProfiles = {
    AT: { length: 20, pattern: /^AT\d{18}$/, country: "Austria" },
    BE: { length: 16, pattern: /^BE\d{14}$/, country: "Belgium" },
    CH: { length: 21, pattern: /^CH\d{7}[A-Z0-9]{12}$/, country: "Switzerland" },
    DE: { length: 22, pattern: /^DE\d{20}$/, country: "Germany" },
    ES: { length: 24, pattern: /^ES\d{22}$/, country: "Spain" },
    FR: { length: 27, pattern: /^FR\d{12}[A-Z0-9]{11}\d{2}$/, country: "France" },
    GB: { length: 22, pattern: /^GB\d{2}[A-Z]{4}\d{14}$/, country: "United Kingdom" },
    IE: { length: 22, pattern: /^IE\d{2}[A-Z]{4}\d{14}$/, country: "Ireland" },
    IT: { length: 27, pattern: /^IT\d{2}[A-Z]\d{10}[A-Z0-9]{12}$/, country: "Italy" },
    NL: { length: 18, pattern: /^NL\d{2}[A-Z]{4}\d{10}$/, country: "Netherlands" },
};
export function normalizeIdentifier(value) {
    return value.replace(/\s/g, "").replace(/[a-z]/g, (letter) => letter.toUpperCase());
}
export function ibanRemainder(value) {
    const rearranged = value.slice(4) + value.slice(0, 4);
    let remainder = 0;
    for (const character of rearranged) {
        const digits = /[A-Z]/.test(character) ? String(character.charCodeAt(0) - 55) : character;
        for (const digit of digits)
            remainder = (remainder * 10 + Number(digit)) % 97;
    }
    return remainder;
}
export function validateIban(value) {
    if (!value)
        return { message: "", detail: "Paste an IBAN, with or without spaces." };
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]*$/.test(value)) {
        return { message: "Start with a two-letter country code and two check digits; use letters and numbers only.", detail: "Check the IBAN format." };
    }
    const profile = ibanProfiles[value.slice(0, 2)];
    if (!profile)
        return { message: "This preview supports AT, BE, CH, DE, ES, FR, GB, IE, IT, and NL.", detail: "Country format not supported in this preview." };
    if (value.length !== profile.length)
        return { message: `An IBAN for ${profile.country} needs ${profile.length} characters; you entered ${value.length}.`, detail: `${value.length} of ${profile.length} characters` };
    if (!profile.pattern.test(value))
        return { message: `Check the account format for ${profile.country}.`, detail: "Country format does not match." };
    if (ibanRemainder(value) !== 1)
        return { message: "The IBAN check digits do not match. Check the account number.", detail: "Checksum does not match." };
    return { message: "", detail: `${profile.country} format and checksum pass. Account not verified.` };
}
export function validateBic(value) {
    if (!value)
        return { message: "", detail: "An 8- or 11-character business identifier." };
    // ISO 9362 permits an alphanumeric business-party prefix, not only bank letters.
    if (!/^[A-Z0-9]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value)) {
        return { message: "Use 8 or 11 letters and numbers, with a two-letter country code in positions 5–6.", detail: "Check the BIC structure." };
    }
    return { message: "", detail: `${value.length}-character structure passes. Registration not verified.` };
}
export function uniqueTags(values) {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
