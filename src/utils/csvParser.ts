import type { SurveyResponse } from '../types/survey';

export interface ParseResult {
  responses: SurveyResponse[];
  warnings: string[];
  error?: string;
}

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  const clean = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(cell.trim());
        if (row.some((c) => c.length > 0)) rows.push(row);
        row = [];
        cell = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        row.push(cell.trim());
        if (row.some((c) => c.length > 0)) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
  }

  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);

  return rows;
}

const KNOWN_PAY_METHODS = [
  'Tap a smart card on a payment machine',
  'Scan a QR code using bKash, Nagad, or another mobile wallet',
  'Pay through a dedicated transportation mobile app',
  'Continue paying with cash',
  'No preference',
];

function extractPayMethods(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return ['Unspecified'];

  const matched: string[] = [];
  for (const option of KNOWN_PAY_METHODS) {
    if (trimmed.includes(option)) {
      matched.push(option);
    }
  }

  if (matched.length > 0) return matched;

  // Early pilot rows (1–4) recorded cashless concern notes in this slot
  return ['Early Pilot Concern Note'];
}

function splitSimpleMultiSelect(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const delimiter = trimmed.includes(';') ? ';' : ',';
  return trimmed
    .split(delimiter)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseTimestampToIsoDate(raw: string): string {
  const str = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);

  // Google Forms direct CSV export: YYYY/MM/DD HH:MM:SS AM/PM GMT+6
  const ymd = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (ymd) {
    const year = ymd[1];
    const month = ymd[2].padStart(2, '0');
    const day = ymd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Google Sheets MM/DD/YYYY HH:MM:SS
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const month = m[1].padStart(2, '0');
    const day = m[2].padStart(2, '0');
    const year = m[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return '2026-11-18';
}

function normalizeQ21(raw: string): string {
  const val = raw.trim();
  if (!val) return 'Unspecified';
  if (/^A\b/i.test(val) || /^Option A/i.test(val)) {
    return 'Option A: Smart Card (2s, Tk 100, Metro & Bus)';
  }
  if (/^B\b/i.test(val) || /^Option B/i.test(val)) {
    return 'Option B: Mobile QR (5s, Free, All Modes)';
  }
  if (/neither/i.test(val)) {
    return 'Neither';
  }
  return val;
}

function normalizeQ22(raw: string): string {
  const val = raw.trim();
  if (!val) return 'Unspecified';
  if (/^A\b/i.test(val) || /^Option A/i.test(val)) {
    return 'Option A: 50 Tk Card (Metro, Bus, Rickshaw)';
  }
  if (/^B\b/i.test(val) || /^Option B/i.test(val)) {
    return 'Option B: 200 Tk Card (All Modes incl. CNG & Water)';
  }
  if (/neither/i.test(val)) {
    return 'Neither';
  }
  return val;
}

function findColumnIndex(headers: string[], patterns: RegExp[]): number {
  for (const pat of patterns) {
    const idx = headers.findIndex((h) => pat.test(h));
    if (idx !== -1) return idx;
  }
  return -1;
}

export function parseSurveyInput(rawText: string): ParseResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      responses: [],
      warnings: [],
      error: 'Input is empty. Upload or paste a Dhaka commuter survey CSV export.',
    };
  }

  const rows = parseCsvRows(trimmed);
  if (rows.length < 2) {
    return {
      responses: [],
      warnings: [],
      error: 'CSV requires a header row and at least one response row.',
    };
  }

  const headers = rows[0].map((h) => h.replace(/\s+/g, ' ').trim());

  const col = {
    timestamp: findColumnIndex(headers, [/^timestamp$/i, /^submitted/i, /date/i]),
    name: findColumnIndex(headers, [/^name$/i, /respondent/i]),
    ageGroup: findColumnIndex(headers, [/age group/i, /^age$/i]),
    gender: findColumnIndex(headers, [/gender/i]),
    occupation: findColumnIndex(headers, [/occupation/i]),
    income: findColumnIndex(headers, [/monthly personal income/i, /income/i]),
    route: findColumnIndex(headers, [/usually travel between/i, /route/i, /corridor/i]),
    frequency: findColumnIndex(headers, [/how often do you use public/i, /frequency/i]),
    mrtPass: findColumnIndex(headers, [/active mrt pass/i, /rapid pass/i]),
    modesUsed: findColumnIndex(headers, [/which transport modes/i, /transport modes/i, /^mode/i]),
    fareBdt: findColumnIndex(headers, [/roughly how much do you spend/i, /spend/i, /fare/i]),
    cashHassle: findColumnIndex(headers, [/face cash hassles/i, /cash hassle/i]),
    headaches: findColumnIndex(headers, [/biggest payment headaches/i, /headache/i]),
    extraTime: findColumnIndex(headers, [/extra time is wasted/i, /time.*wasted/i]),
    lackedCash: findColumnIndex(headers, [/lacked physical cash/i, /sufficient balance/i]),
    mobileWallet: findColumnIndex(headers, [/use mobile wallets/i, /bkash.*nagad/i]),
    digitalFreq: findColumnIndex(headers, [/last 30 days.*pay digitally/i, /pay digitally/i]),
    adoptionIntent: findColumnIndex(headers, [/if one card or mobile app worked everywhere/i, /would you use it/i, /adoption/i]),
    topReason: findColumnIndex(headers, [/#1 reason/i, /reason you would want/i]),
    payMethods: findColumnIndex(headers, [/how would you prefer to pay/i, /prefer to pay/i]),
    preferredFormat: findColumnIndex(headers, [/which format would you prefer/i, /format/i]),
    speedReq: findColumnIndex(headers, [/how fast does the payment/i, /speed/i]),
    q21: findColumnIndex(headers, [/^21\./i, /faster payment or more transport/i]),
    q22: findColumnIndex(headers, [/^22\./i, /payment speed or transport coverage/i]),
  };

  if (col.modesUsed === -1 && col.adoptionIntent === -1 && col.cashHassle === -1) {
    return {
      responses: [],
      warnings: [],
      error:
        'Unrecognized CSV columns. Expected Google Forms Dhaka commuter survey headers (e.g. transport modes, cash hassles, adoption intent, preferred format).',
    };
  }

  const responses: SurveyResponse[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.every((c) => c === '')) continue;

    const get = (idx: number, fallback = '') => (idx >= 0 && r[idx] !== undefined ? r[idx].trim() : fallback);

    const rawTimestamp = get(col.timestamp, '11/18/2026 12:00:00');
    const nameVal = get(col.name);
    const transitPassStatus = get(col.mrtPass, 'No, I pay with cash or paper tokens');
    const hasTransitPass = /^yes/i.test(transitPassStatus);

    const rawFare = get(col.fareBdt);
    const parsedFare = Number(rawFare.replace(/[^0-9.]/g, ''));
    const fareBdt = rawFare !== '' && Number.isFinite(parsedFare) && parsedFare > 0 ? parsedFare : null;

    const rawIntent = Number(get(col.adoptionIntent, '4'));
    const adoptionIntent = Number.isFinite(rawIntent)
      ? Math.max(1, Math.min(5, Math.round(rawIntent)))
      : 4;

    const modes = splitSimpleMultiSelect(get(col.modesUsed));
    const headaches = splitSimpleMultiSelect(get(col.headaches));

    responses.push({
      id: `DH-${String(101 + responses.length)}`,
      submittedAt: parseTimestampToIsoDate(rawTimestamp),
      submittedTimestamp: rawTimestamp,
      respondentName: nameVal || `Commuter #${101 + responses.length}`,
      ageGroup: get(col.ageGroup, '18–24'),
      gender: get(col.gender, 'Unspecified'),
      occupation: get(col.occupation, 'Unspecified'),
      incomeBracket: get(col.income, 'Unspecified'),
      route: get(col.route, 'Unspecified corridor'),
      frequency: get(col.frequency, '2–4 days a week'),
      hasTransitPass,
      transitPassStatus,
      modesUsed: modes.length > 0 ? modes : ['Unspecified'],
      fareBdt,
      cashHassleFreq: get(col.cashHassle, 'Sometimes (1–2 times a week)'),
      paymentHeadaches: headaches.length > 0 ? headaches : ['None / No significant issues'],
      extraTimeWasted: get(col.extraTime, '1 to 3 minutes'),
      lackedCashMoment: get(col.lackedCash) || 'Not asked (early pilot)',
      mobileWalletUsage: get(col.mobileWallet, 'Unspecified'),
      digitalPayFreq30d: get(col.digitalFreq, 'Unspecified'),
      adoptionIntent,
      topReason: get(col.topReason, 'Unspecified'),
      preferredPayMethods: extractPayMethods(get(col.payMethods)),
      preferredFormat: get(col.preferredFormat, 'Unspecified'),
      speedRequirement: get(col.speedReq, 'Unspecified'),
      q21Tradeoff: normalizeQ21(get(col.q21)),
      q22Tradeoff: normalizeQ22(get(col.q22)),
    });
  }

  if (responses.length === 0) {
    return {
      responses: [],
      warnings: [],
      error: 'No response rows found beneath the CSV header.',
    };
  }

  return { responses, warnings: [] };
}

function escapeCsvCell(value: string | number | boolean | null): string {
  const str = value === null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportResponsesToCsv(responses: SurveyResponse[]): string {
  const headers = [
    'id',
    'submitted_at',
    'respondent',
    'age_group',
    'gender',
    'occupation',
    'income_bracket',
    'route',
    'frequency',
    'has_mrt_rapid_pass',
    'modes_used',
    'fare_bdt',
    'cash_hassle_frequency',
    'payment_headaches',
    'extra_time_wasted',
    'lacked_cash_moment',
    'mobile_wallet',
    'digital_pay_30d',
    'adoption_intent_1_to_5',
    'top_reason',
    'preferred_format',
    'speed_requirement',
    'q21_card_vs_qr',
    'q22_50tk_vs_200tk_card',
  ];

  const lines = [headers.join(',')];
  for (const r of responses) {
    lines.push(
      [
        r.id,
        r.submittedAt,
        r.respondentName,
        r.ageGroup,
        r.gender,
        r.occupation,
        r.incomeBracket,
        r.route,
        r.frequency,
        r.hasTransitPass,
        r.modesUsed.join(', '),
        r.fareBdt,
        r.cashHassleFreq,
        r.paymentHeadaches.join(', '),
        r.extraTimeWasted,
        r.lackedCashMoment,
        r.mobileWalletUsage,
        r.digitalPayFreq30d,
        r.adoptionIntent,
        r.topReason,
        r.preferredFormat,
        r.speedRequirement,
        r.q21Tradeoff,
        r.q22Tradeoff,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }
  return lines.join('\n');
}
