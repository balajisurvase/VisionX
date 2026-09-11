/**
 * ICAO Doc 9303 Machine Readable Zone (MRZ) & Date Utilities
 * Accurately formats, parses, and calculates Modulo-10 (7-3-1) check digits.
 */

const WEIGHTS = [7, 3, 1];

/**
 * Returns ICAO character numeric value:
 * 0-9 -> 0-9
 * A-Z -> 10-35
 * < or others -> 0
 */
export function getIcaoCharValue(char: string): number {
  const upper = char.toUpperCase();
  if (upper >= '0' && upper <= '9') {
    return upper.charCodeAt(0) - 48;
  }
  if (upper >= 'A' && upper <= 'Z') {
    return upper.charCodeAt(0) - 55; // 'A' (65) -> 10
  }
  return 0; // '<' or whitespace
}

/**
 * Calculates ICAO 9303 Modulo-10 check digit with 7-3-1 weighting
 */
export function calculateIcaoCheckDigit(input: string): string {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    const charVal = getIcaoCharValue(input[i]);
    const weight = WEIGHTS[i % 3];
    sum += charVal * weight;
  }
  return (sum % 10).toString();
}

/**
 * Converts any date string (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, YYYYMMDD)
 * to ISO YYYY-MM-DD format
 */
export function normalizeIsoDate(dateStr: string | null | undefined, defaultDate: string = '1998-03-14'): string {
  if (!dateStr || dateStr.trim() === '') return defaultDate;

  const cleaned = dateStr.trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // If DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // If YYYY/MM/DD
  const ymdMatch = cleaned.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // If YYMMDD (6 digits from MRZ)
  if (/^\d{6}$/.test(cleaned)) {
    return mrzDateToIso(cleaned, false);
  }

  // Try standard Date parse
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return defaultDate;
}

/**
 * Converts ISO YYYY-MM-DD to MRZ 6-digit YYMMDD
 */
export function isoToMrzDate(isoDateStr: string | null | undefined, fallback: string = '980314'): string {
  const norm = normalizeIsoDate(isoDateStr);
  const parts = norm.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const yy = parts[0].slice(2, 4);
    const mm = parts[1].padStart(2, '0');
    const dd = parts[2].padStart(2, '0');
    return `${yy}${mm}${dd}`;
  }
  return fallback;
}

/**
 * Converts MRZ 6-digit YYMMDD to ISO YYYY-MM-DD
 * @param yymmdd 6 digit date string
 * @param isExpiry true if parsing expiry date, false for date of birth
 */
export function mrzDateToIso(yymmdd: string, isExpiry: boolean = false): string {
  if (!yymmdd || yymmdd.length !== 6) return '2028-04-14';

  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);

  let fullYear: number;
  if (isExpiry) {
    // Expiration dates: 00-79 -> 2000-2079, 80-99 -> 1980-1999
    fullYear = yy < 80 ? 2000 + yy : 1900 + yy;
  } else {
    // Date of birth: current year is 2026. 00-26 -> 2000-2026, 27-99 -> 1927-1999
    fullYear = yy <= 26 ? 2000 + yy : 1900 + yy;
  }

  return `${fullYear}-${mm}-${dd}`;
}

/**
 * Formats a date for human passport visual inspection: "14 MAR 1998"
 */
export function formatVisualDate(isoDateStr: string | null | undefined): string {
  const norm = normalizeIsoDate(isoDateStr);
  const parts = norm.split('-');
  if (parts.length !== 3) return norm;

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthStr = months[monthIdx] || parts[1];

  return `${parts[2]} ${monthStr} ${parts[0]}`;
}

/**
 * Generates compliant 2-line ICAO Doc 9303 TD3 Machine Readable Zone (MRZ)
 */
export function generateTd3Mrz(params: {
  documentType?: string;
  countryCode?: string;
  fullName: string;
  documentNumber: string;
  nationality?: string;
  dateOfBirth?: string;
  dateOfExpiry?: string;
  gender?: string;
  optionalData?: string;
}): { line1: string; line2: string; docNoCheck: string; dobCheck: string; expCheck: string; compositeCheck: string } {
  const docCode = (params.documentType?.startsWith('V') ? 'V<' : 'P<').padEnd(2, '<');
  const country = (params.countryCode || 'IND').slice(0, 3).padEnd(3, '<').toUpperCase();

  // Name formatting: SURNAME<<GIVEN<NAMES
  const nameParts = params.fullName.trim().split(/\s+/);
  let formattedName = '';
  if (nameParts.length === 1) {
    formattedName = nameParts[0].toUpperCase();
  } else {
    const surname = nameParts[nameParts.length - 1].toUpperCase();
    const given = nameParts.slice(0, -1).join('<').toUpperCase();
    formattedName = `${surname}<<${given}`;
  }
  const cleanName = formattedName.replace(/[^A-Z<]/g, '<');
  const line1 = `${docCode}${country}${cleanName}`.padEnd(44, '<').slice(0, 44);

  // Line 2 Components
  const rawDocNo = (params.documentNumber || 'DEMOPPT001').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const docNoField = rawDocNo.padEnd(9, '<').slice(0, 9);
  const docNoCheck = calculateIcaoCheckDigit(docNoField);

  const nat = (params.nationality || 'IND').slice(0, 3).padEnd(3, '<').toUpperCase();

  const dobYymmdd = isoToMrzDate(params.dateOfBirth, '980314');
  const dobCheck = calculateIcaoCheckDigit(dobYymmdd);

  const sex = (params.gender?.toUpperCase().startsWith('F') ? 'F' : params.gender?.toUpperCase().startsWith('M') ? 'M' : 'X');

  const expYymmdd = isoToMrzDate(params.dateOfExpiry, '310820');
  const expCheck = calculateIcaoCheckDigit(expYymmdd);

  const optData = (params.optionalData || '').replace(/[^A-Z0-9]/gi, '').padEnd(14, '<').slice(0, 14);
  const optCheck = calculateIcaoCheckDigit(optData);

  // Composite check digit calculated over: docNo + docNoCheck + dob + dobCheck + exp + expCheck + optData (+ optCheck if present)
  const compositeString = `${docNoField}${docNoCheck}${dobYymmdd}${dobCheck}${expYymmdd}${expCheck}${optData}`;
  const compositeCheck = calculateIcaoCheckDigit(compositeString);

  const line2 = `${docNoField}${docNoCheck}${nat}${dobYymmdd}${dobCheck}${sex}${expYymmdd}${expCheck}${optData}${compositeCheck}`.padEnd(44, '<').slice(0, 44);

  return {
    line1,
    line2,
    docNoCheck,
    dobCheck,
    expCheck,
    compositeCheck,
  };
}

export interface ExpiryEvaluation {
  isExpired: boolean;
  isExpiringSoon: boolean; // less than 6 months (180 days)
  expiryIso: string;
  visualDate: string;
  diffDays: number;
  diffMonths: number;
  relativeTimeText: string;
  urgency: 'EXPIRED' | 'CRITICAL_WARNING' | 'EXPIRING_SOON' | 'ACTIVE';
  statusLabel: string;
  detailedNotice: string;
  currentReferenceIso: string;
  currentReferenceFormatted: string;
}

/**
 * Accurately compares document date of expiry against real-time system clock.
 * Checks both absolute expiration and the ICAO 6-month international validity rule.
 */
export function evaluateRealTimeExpiry(
  expiryDateStr: string | null | undefined,
  referenceDate: Date = new Date()
): ExpiryEvaluation {
  const normExpiry = normalizeIsoDate(expiryDateStr, '2031-08-20');
  const visualDate = formatVisualDate(normExpiry);

  const refNow = new Date(referenceDate);
  const refYear = refNow.getFullYear();
  const refMonth = refNow.getMonth();
  const refDay = refNow.getDate();

  // Create date at midnight of today
  const todayMidnight = new Date(refYear, refMonth, refDay, 0, 0, 0, 0);

  // Parse expiry date components
  const [expYear, expMonth, expDay] = normExpiry.split('-').map(Number);
  const expiryMidnight = new Date(expYear, expMonth - 1, expDay, 23, 59, 59, 999);

  const diffMs = expiryMidnight.getTime() - refNow.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30.4375);

  const isExpired = diffDays < 0;
  const isExpiringSoon = !isExpired && diffDays <= 180; // 6 months rule

  let relativeTimeText = '';
  if (isExpired) {
    const absDays = Math.abs(diffDays);
    if (absDays === 0) relativeTimeText = 'Expired today';
    else if (absDays === 1) relativeTimeText = 'Expired yesterday';
    else if (absDays < 60) relativeTimeText = `Expired ${absDays} days ago`;
    else if (absDays < 365) relativeTimeText = `Expired ${Math.floor(absDays / 30)} months ago`;
    else {
      const yrs = (absDays / 365.25).toFixed(1);
      relativeTimeText = `Expired ${yrs} years ago (${absDays} days past limit)`;
    }
  } else {
    if (diffDays === 0) relativeTimeText = 'Expires today';
    else if (diffDays === 1) relativeTimeText = 'Expires tomorrow';
    else if (diffDays < 60) relativeTimeText = `Expires in ${diffDays} days`;
    else if (diffDays < 365) relativeTimeText = `Expires in ${diffMonths} months`;
    else {
      const yrs = (diffDays / 365.25).toFixed(1);
      relativeTimeText = `Valid for ${yrs} years (${diffDays} days remaining)`;
    }
  }

  let urgency: 'EXPIRED' | 'CRITICAL_WARNING' | 'EXPIRING_SOON' | 'ACTIVE' = 'ACTIVE';
  let statusLabel = 'ACTIVE & VALID';
  let detailedNotice = `Document is within valid timeline limits. Validity ends on ${visualDate}.`;

  if (isExpired) {
    urgency = 'EXPIRED';
    statusLabel = 'EXPIRED (REAL-TIME TIMELINE)';
    detailedNotice = `REAL-TIME DETECTION: Document validity lapsed on ${visualDate} (${relativeTimeText}). Border clearance prohibited.`;
  } else if (diffDays <= 30) {
    urgency = 'CRITICAL_WARNING';
    statusLabel = 'CRITICAL: EXPIRING IN < 30 DAYS';
    detailedNotice = `Urgent alert: Document validity ends in ${diffDays} days (${visualDate}). Immediate renewal required.`;
  } else if (isExpiringSoon) {
    urgency = 'EXPIRING_SOON';
    statusLabel = 'ICAO 6-MONTH ADVISORY';
    detailedNotice = `Notice: Document expires in ${diffDays} days (${diffMonths} months). May fail 6-month validity rules for foreign immigration.`;
  }

  const currentReferenceIso = refNow.toISOString().split('T')[0];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const currentReferenceFormatted = `${refDay.toString().padStart(2, '0')} ${months[refMonth]} ${refYear}`;

  return {
    isExpired,
    isExpiringSoon,
    expiryIso: normExpiry,
    visualDate,
    diffDays,
    diffMonths,
    relativeTimeText,
    urgency,
    statusLabel,
    detailedNotice,
    currentReferenceIso,
    currentReferenceFormatted,
  };
}
