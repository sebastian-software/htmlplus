import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIdentifier, validateIban, validateBic } from '../dist/src/validation.js';

test('published sample IBANs pass for each supported national format', () => {
  for (const value of [
    'AT611904300234573201', 'BE68539007547034', 'CH9300762011623852957',
    'DE89370400440532013000', 'ES9121000418450200051332', 'FR1420041010050500013M02606',
    'GB82WEST12345698765432', 'IE29AIBK93115212345678', 'IT60X0542811101000000123456', 'NL91ABNA0417164300',
  ]) assert.equal(validateIban(value).message, '', value);
});

test('a plausible length is insufficient: checksum, structure, and support are checked', () => {
  assert.match(validateIban('DE89370400440532013001').message, /check digits/);
  assert.match(validateIban('DE8937040044053201300').message, /22 characters/);
  assert.match(validateIban('GB82123412345698765432').message, /account format/);
  assert.match(validateIban('ZZ001234567890').message, /preview supports/);
  assert.match(validateIban('DE89/70400440532013000').message, /letters and numbers/);
});

test('normalization preserves invalid characters for correction and BIC accepts both lengths', () => {
  assert.equal(normalizeIdentifier(' de89 3704\n0044 0532 0130 00 '), 'DE89370400440532013000');
  assert.equal(normalizeIdentifier('de89/1234'), 'DE89/1234');
  assert.equal(validateBic('DEUTDEFF').message, '');
  assert.equal(validateBic('DEUTDEFFXXX').message, '');
  assert.equal(validateBic('A1B2DE3F').message, '');
  assert.notEqual(validateBic('DEUT12FF').message, '');
  assert.notEqual(validateBic('DEUTDEFFX').message, '');
});
