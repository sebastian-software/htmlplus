import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCalendarDate, dateTextFormat } from '../dist/src/date-value.js';

test('calendar dates reject invalid days, rollover, timestamps, and unsupported year shapes', () => {
  for(const text of ['0001-01-01','1900-02-28','2000-02-29','2028-02-29','9999-12-31']) assert.equal(parseCalendarDate(text)?.toString(),text);
  for(const text of ['','0000-01-01','1900-02-29','2027-02-29','2028-02-30','2028-04-31','2028-00-01','2028-13-01','2028-01-00','2028-1-1','2028-02-29T00:00:00Z','10000-01-01',' 2028-02-29']) assert.equal(parseCalendarDate(text),null,text);
});
test('numeric locale formats preserve date-only values and parse only their explicit order and separators', () => {
  const date=parseCalendarDate('2028-02-29');
  for(const [locale,text,placeholder] of [['en-US','02/29/2028','MM/DD/YYYY'],['en-GB','29/02/2028','DD/MM/YYYY'],['de-DE','29.02.2028','DD.MM.YYYY'],['ja-JP','2028/02/29','YYYY/MM/DD']]) {
    const format=dateTextFormat(locale);assert.equal(format.format(date),text);assert.equal(format.placeholder,placeholder);
    assert.equal(format.parse(text)?.toString(),'2028-02-29');assert.equal(format.parse('2028-02-29')?.toString(),'2028-02-29');
    assert.equal(format.parse(format.format(parseCalendarDate('0001-01-01')))?.toString(),'0001-01-01');
  }
  assert.equal(dateTextFormat('en-US').parse('02/03/2028')?.toString(),'2028-02-03');
  assert.equal(dateTextFormat('en-GB').parse('02/03/2028')?.toString(),'2028-03-02');
  for(const text of ['02/30/2028','2/3/28','tomorrow','2028-02','2.29.2028']) assert.equal(dateTextFormat('en-US').parse(text),null);
});
test('locale validation is explicit and calendar extensions cannot change the Gregorian value model', () => {
  assert.equal(dateTextFormat('not_a_locale'),null);assert.equal(dateTextFormat('zz-ZZ'),null);
  const format=dateTextFormat('th-TH-u-ca-buddhist');
  assert.match(format.locale,/gregory/);
  assert.equal(format.parse(format.format(parseCalendarDate('2028-02-29')))?.toString(),'2028-02-29');
});
test('localized digits round-trip through Intl while submission remains ASCII ISO', () => {
  for (const locale of ['ar-EG','fa-IR','bn-BD','th-TH-u-nu-thai','en-US-u-nu-mathsans']) {
    const format = dateTextFormat(locale), date = parseCalendarDate('2028-02-29');
    const expected = new Intl.DateTimeFormat(locale, {calendar:'gregory',timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).format(date.toDate('UTC')).replace(/[\u061c\u200e\u200f]/g,'');
    assert.equal(format.format(date), expected);
    assert.equal(format.parse(expected)?.toString(),'2028-02-29');
    assert.equal(format.parse('2028-02-29')?.toString(),'2028-02-29');
    assert.equal(format.parse(format.format(parseCalendarDate('0001-01-01')))?.toString(),'0001-01-01');
  }
});
