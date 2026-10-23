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
test('locale validation is explicit and calendar or numbering extensions cannot change the value model', () => {
  assert.equal(dateTextFormat('not_a_locale'),null);assert.equal(dateTextFormat('zz-ZZ'),null);
  const format=dateTextFormat('th-TH-u-ca-buddhist');
  assert.match(format.locale,/gregory/);assert.match(format.locale,/latn/);
  assert.equal(format.parse(format.format(parseCalendarDate('2028-02-29')))?.toString(),'2028-02-29');
});
