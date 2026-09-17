import { RegisteredPerson, RegisteredDocumentItem, DatabaseMatchResult, FieldMatchDetail } from '../types/person';
import { API_ENDPOINTS } from '../config/api';

/**
 * Default Seeded Registered Persons database for standalone / offline operations.
 * Also mirrored directly in backend server and Supabase schemas.
 */
export const DEFAULT_REGISTERED_PERSONS: RegisteredPerson[] = [];

// In-memory cache for client persistence
let localPersonsCache: RegisteredPerson[] = [...DEFAULT_REGISTERED_PERSONS];

export async function fetchRegisteredPersons(
  search?: string,
  status?: string
): Promise<RegisteredPerson[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);

    const url = params.toString() ? `${API_ENDPOINTS.persons.list}?${params.toString()}` : API_ENDPOINTS.persons.list;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        localPersonsCache = data;
        return data;
      }
    }
  } catch (err) {
    console.warn('[PersonService] Using local registry store:', err);
  }

  // Local fallback filtering
  let filtered = [...localPersonsCache];
  if (status && status !== 'ALL') {
    filtered = filtered.filter((p) => p.status === status);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.person_code.toLowerCase().includes(q) ||
        p.full_name.toLowerCase().includes(q) ||
        p.nationality.toLowerCase().includes(q) ||
        p.documents.some((d) => d.document_number.toLowerCase().includes(q))
    );
  }
  return filtered;
}

export async function fetchPersonById(id: string | number): Promise<RegisteredPerson | null> {
  try {
    const res = await fetch(API_ENDPOINTS.persons.detail(id));
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[PersonService] Fetch person detail failed, searching local store:', err);
  }
  const found = localPersonsCache.find(
    (p) => String(p.id) === String(id) || p.person_code.toLowerCase() === String(id).toLowerCase()
  );
  return found || null;
}

export async function createRegisteredPerson(
  personData: Partial<RegisteredPerson>,
  documentData?: Partial<RegisteredDocumentItem>
): Promise<RegisteredPerson> {
  const payload = {
    person: personData,
    document: documentData,
  };

  try {
    const res = await fetch(API_ENDPOINTS.persons.create, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const created = await res.json();
      localPersonsCache.unshift(created);
      return created;
    }
  } catch (err) {
    console.warn('[PersonService] Server creation unavailable, storing in client state:', err);
  }

  // Local creation fallback
  const newId = `p-${Date.now()}`;
  const personCode = personData.person_code || `P${String(localPersonsCache.length + 1).padStart(3, '0')}`;
  
  const docs: RegisteredDocumentItem[] = [];
  if (documentData && documentData.document_number) {
    docs.push({
      id: `doc-${Date.now()}`,
      person_id: newId,
      document_type: documentData.document_type || 'Passport',
      document_number: documentData.document_number,
      issue_date: documentData.issue_date || new Date().toISOString().split('T')[0],
      expiry_date: documentData.expiry_date || '2034-01-01',
      issuing_country: documentData.issuing_country || personData.nationality || 'India',
      document_hash: `hash-${Date.now()}`,
      status: 'VALID',
      created_at: new Date().toISOString(),
    });
  }

  const newPerson: RegisteredPerson = {
    id: newId,
    person_code: personCode,
    full_name: personData.full_name || 'Anonymous Person',
    date_of_birth: personData.date_of_birth || '2000-01-01',
    nationality: personData.nationality || 'Indian',
    gender: personData.gender || 'Male',
    status: personData.status || 'ACTIVE',
    photo_url: personData.photo_url || '',
    email: personData.email || '',
    phone: personData.phone || '',
    address: personData.address || '',
    documents: docs,
    created_at: new Date().toISOString(),
    notes: personData.notes || 'Registered through officer terminal.',
  };

  localPersonsCache.unshift(newPerson);
  return newPerson;
}

export async function deleteRegisteredPerson(id: string | number): Promise<boolean> {
  try {
    const res = await fetch(API_ENDPOINTS.persons.delete(id), { method: 'DELETE' });
    if (res.ok) {
      localPersonsCache = localPersonsCache.filter((p) => String(p.id) !== String(id) && p.person_code !== String(id));
      return true;
    }
  } catch (err) {
    console.warn('[PersonService] Delete failed on server:', err);
  }
  localPersonsCache = localPersonsCache.filter((p) => String(p.id) !== String(id) && p.person_code !== String(id));
  return true;
}

/**
 * Perform deep field-by-field identity comparison between extracted document and registered person database.
 */
export async function matchPersonCredential(params: {
  document_number?: string;
  full_name?: string;
  date_of_birth?: string;
  nationality?: string;
  gender?: string;
  date_of_expiry?: string;
  document_type?: string;
}): Promise<DatabaseMatchResult> {
  try {
    const res = await fetch(API_ENDPOINTS.persons.match, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[PersonService] Server matching error, running local rule engine:', err);
  }

  return performLocalIdentityMatch(params);
}

export function performLocalIdentityMatch(params: {
  document_number?: string;
  full_name?: string;
  date_of_birth?: string;
  nationality?: string;
  gender?: string;
  date_of_expiry?: string;
  document_type?: string;
}): DatabaseMatchResult {
  const cleanDocNum = (params.document_number || '').trim().toUpperCase().replace(/[\s-]/g, '');
  const cleanName = (params.full_name || '').trim().toUpperCase();

  // Search by document number first
  let matchedPerson: RegisteredPerson | undefined;
  let matchedDoc: RegisteredDocumentItem | undefined;

  for (const person of localPersonsCache) {
    for (const doc of person.documents) {
      const registeredDocNum = doc.document_number.trim().toUpperCase().replace(/[\s-]/g, '');
      if (cleanDocNum && registeredDocNum === cleanDocNum) {
        matchedPerson = person;
        matchedDoc = doc;
        break;
      }
    }
    if (matchedPerson) break;
  }

  // Strict matching rule: The primary lookup key for an uploaded document is the extracted document number.
  // Never choose a registered person independently from the document number.
  if (!cleanDocNum || !matchedPerson || !matchedDoc) {
    return {
      match_status: 'NOT_FOUND',
      overall_match_score: 0,
      matched_person: null,
      matched_document: null,
      field_comparisons: [
        {
          field_name: 'document_number',
          label: 'Document Number',
          uploaded_value: params.document_number || 'Not Available',
          database_value: 'Record Not Found',
          is_match: false,
          similarity_score: 0,
          notes: 'No matching document serial registered in database.',
        },
      ],
      mismatch_reasons: ['Document number and applicant name not found in registered database.'],
      recommendation: 'Treat as unregistered/external credential. Perform complete standard manual verification.',
      searched_query: {
        document_number: params.document_number,
        full_name: params.full_name,
        nationality: params.nationality,
      },
    };
  }

  // Field by Field Comparisons
  const fieldComparisons: FieldMatchDetail[] = [];
  const mismatchReasons: string[] = [];
  let totalScore = 0;
  let fieldWeightsSum = 0;

  const compareField = (
    fieldName: string,
    label: string,
    uploaded: string | undefined,
    database: string | undefined,
    weight: number
  ) => {
    fieldWeightsSum += weight;
    const uClean = (uploaded || '').trim().toUpperCase();
    const dClean = (database || '').trim().toUpperCase();

    if (!uClean || !dClean) {
      fieldComparisons.push({
        field_name: fieldName,
        label,
        uploaded_value: uploaded || 'Not detected',
        database_value: database || 'Not registered',
        is_match: false,
        similarity_score: 50,
        notes: 'Field missing in uploaded document or database.',
      });
      totalScore += 50 * weight;
      return;
    }

    let isMatch = false;
    let score = 0;

    if (fieldName === 'date_of_birth' || fieldName === 'expiry_date') {
      // Date normalization comparison
      const uNorm = uClean.replace(/[^0-9]/g, '');
      const dNorm = dClean.replace(/[^0-9]/g, '');
      isMatch = uNorm === dNorm || uClean === dClean;
      score = isMatch ? 100 : 0;
    } else if (fieldName === 'gender') {
      const uG = uClean.slice(0, 1);
      const dG = dClean.slice(0, 1);
      isMatch = uG === dG;
      score = isMatch ? 100 : 0;
    } else if (fieldName === 'document_number') {
      const uDoc = uClean.replace(/[\s-]/g, '');
      const dDoc = dClean.replace(/[\s-]/g, '');
      isMatch = uDoc === dDoc;
      score = isMatch ? 100 : 0;
    } else if (fieldName === 'full_name') {
      if (uClean === dClean) {
        isMatch = true;
        score = 100;
      } else if (uClean.includes(dClean) || dClean.includes(uClean)) {
        isMatch = true;
        score = 85;
      } else {
        isMatch = false;
        score = 10;
      }
    } else {
      isMatch = uClean === dClean;
      score = isMatch ? 100 : 0;
    }

    if (!isMatch) {
      mismatchReasons.push(`${label} discrepancy: Uploaded "${uploaded}" vs Database "${database}"`);
    }

    totalScore += score * weight;

    fieldComparisons.push({
      field_name: fieldName,
      label,
      uploaded_value: uploaded || 'Not detected',
      database_value: database || 'Not registered',
      is_match: isMatch,
      similarity_score: score,
      notes: isMatch ? 'Exact match' : 'Values differ between credential and database',
    });
  };

  compareField('full_name', 'Full Name', params.full_name, matchedPerson.full_name, 25);
  compareField('date_of_birth', 'Date of Birth', params.date_of_birth, matchedPerson.date_of_birth, 20);
  compareField('document_number', 'Document Number', params.document_number, matchedDoc.document_number, 20);
  compareField('nationality', 'Nationality', params.nationality, matchedPerson.nationality, 15);
  compareField('gender', 'Gender', params.gender, matchedPerson.gender, 10);
  compareField('expiry_date', 'Date of Expiry', params.date_of_expiry, matchedDoc.expiry_date, 10);

  const overallScore = Math.round(totalScore / (fieldWeightsSum || 1));

  let matchStatus: 'EXACT_MATCH' | 'PARTIAL_MATCH' | 'MISMATCH' | 'NOT_FOUND' = 'EXACT_MATCH';
  let recommendation = 'Document perfectly matches registered citizen identity.';

  if (overallScore >= 95 && mismatchReasons.length === 0) {
    matchStatus = 'EXACT_MATCH';
    recommendation = `Identity verified against registered person profile (${matchedPerson.person_code} - ${matchedPerson.full_name}). All critical fields matched.`;
  } else if (overallScore >= 70) {
    matchStatus = 'PARTIAL_MATCH';
    recommendation = `Minor discrepancies detected with registered profile (${matchedPerson.person_code}). Manual inspection advised.`;
  } else {
    matchStatus = 'MISMATCH';
    recommendation = `CRITICAL IDENTITY MISMATCH: Document claims registered serial ${matchedDoc.document_number}, but extracted identity details conflict with registered profile (${matchedPerson.person_code} - ${matchedPerson.full_name}). Suspected impersonation or document tampering.`;
  }

  return {
    match_status: matchStatus,
    overall_match_score: overallScore,
    matched_person: matchedPerson,
    matched_document: matchedDoc,
    field_comparisons: fieldComparisons,
    mismatch_reasons: mismatchReasons,
    recommendation,
    searched_query: {
      document_number: params.document_number,
      full_name: params.full_name,
      nationality: params.nationality,
    },
  };
}
