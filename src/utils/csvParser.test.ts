import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { exportResponsesToCsv, parseSurveyInput } from './csvParser';

const REAL_CSV_PATH = path.resolve(
  process.cwd(),
  'public/assets/aistudio/Commuter_Survey_-_Multimodal_Cashless_Transit_in_Dhaka_baab162c.csv'
);

test('parseSurveyInput parses the attached Dhaka Multimodal Cashless Transit CSV cleanly', () => {
  const csvText = fs.readFileSync(REAL_CSV_PATH, 'utf8');
  const result = parseSurveyInput(csvText);

  assert.equal(result.error, undefined);
  assert.equal(result.responses.length, 100);

  // First pilot row
  assert.equal(result.responses[0].submittedAt, '2026-11-04');
  assert.equal(result.responses[0].adoptionIntent, 5);
  assert.ok(result.responses[0].modesUsed.includes('Hatirjheel Water Taxi'));
  assert.equal(
    result.responses[0].q21Tradeoff,
    'Option B: Mobile QR (5s, Free, All Modes)'
  );

  // Row with multi-select bKash/Nagad QR option containing internal commas
  const bkashRow = result.responses.find((r) =>
    r.preferredPayMethods.includes('Scan a QR code using bKash, Nagad, or another mobile wallet')
  );
  assert.ok(bkashRow, 'Expected bKash/Nagad QR payment option to stay intact without splitting');

  // Verify no broken fragment like "Nagad" exists in preferredPayMethods
  for (const row of result.responses) {
    assert.ok(!row.preferredPayMethods.includes('Nagad'));
  }
});

test('parseSurveyInput rejects empty or invalid headers cleanly', () => {
  assert.ok(parseSurveyInput('   ').error);
  assert.ok(parseSurveyInput('col_a,col_b\n1,2').error);
});

test('exportResponsesToCsv outputs clean escaped CSV', () => {
  const csvText = fs.readFileSync(REAL_CSV_PATH, 'utf8');
  const parsed = parseSurveyInput(csvText);
  const exported = exportResponsesToCsv(parsed.responses.slice(0, 5));
  const lines = exported.split('\n');
  assert.equal(lines.length, 6);
  assert.ok(lines[0].startsWith('id,submitted_at,respondent'));
});
