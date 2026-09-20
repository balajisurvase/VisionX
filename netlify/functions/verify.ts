import { executeVerificationPipeline } from '../../verificationEngine';

function parseMultipartBody(
  buffer: Buffer,
  boundary: string
): Array<{ name: string; filename?: string; type: string; data: Buffer }> {
  const boundaryBuffer = Buffer.from('--' + boundary);
  const crlfBuffer = Buffer.from('\r\n\r\n');
  const parts: Array<{ name: string; filename?: string; type: string; data: Buffer }> = [];
  let startIndex = 0;

  while ((startIndex = buffer.indexOf(boundaryBuffer, startIndex)) !== -1) {
    startIndex += boundaryBuffer.length;
    if (buffer.slice(startIndex, startIndex + 2).toString() === '--') break;
    if (buffer.slice(startIndex, startIndex + 2).toString() === '\r\n') startIndex += 2;

    const nextBoundary = buffer.indexOf(boundaryBuffer, startIndex);
    if (nextBoundary === -1) break;

    const partBuffer = buffer.slice(startIndex, nextBoundary - 2);
    const headerEnd = partBuffer.indexOf(crlfBuffer);
    if (headerEnd !== -1) {
      const headerStr = partBuffer.slice(0, headerEnd).toString();
      const body = partBuffer.slice(headerEnd + 4);
      const nameMatch = headerStr.match(/name="([^"]+)"/);
      const filenameMatch = headerStr.match(/filename="([^"]+)"/);
      const contentTypeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
      parts.push({
        name: nameMatch ? nameMatch[1] : '',
        filename: filenameMatch ? filenameMatch[1] : undefined,
        type: contentTypeMatch ? contentTypeMatch[1].trim() : 'text/plain',
        data: body,
      });
    }
    startIndex = nextBoundary;
  }
  return parts;
}

export default async function (req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let docBuffer: Buffer | null = null;
    let docOriginalName = 'document.jpg';
    let docMimeType = 'image/jpeg';
    let personBuffer: Buffer | null = null;
    let personOriginalName: string | null = null;
    let personMimeType: string | null = null;
    let documentType = 'Passport';
    let officerId = 'officer001';

    try {
      const formData = await req.formData();
      const docFile = formData.get('file') as File | null;
      const personFile = formData.get('person_photo') as File | null;
      documentType = (formData.get('document_type') as string) || 'Passport';
      officerId = (formData.get('officer_id') as string) || 'officer001';

      if (docFile && typeof docFile.arrayBuffer === 'function') {
        const docArrayBuf = await docFile.arrayBuffer();
        docBuffer = Buffer.from(docArrayBuf);
        docOriginalName = docFile.name || 'document.jpg';
        docMimeType = docFile.type || 'image/jpeg';
      }

      if (personFile && typeof personFile.arrayBuffer === 'function') {
        const pArrayBuf = await personFile.arrayBuffer();
        personBuffer = Buffer.from(pArrayBuf);
        personOriginalName = personFile.name || 'person.jpg';
        personMimeType = personFile.type || 'image/jpeg';
      }
    } catch (formErr) {
      console.warn('req.formData() stream threw error; falling back to arrayBuffer multipart parsing:', formErr);
      const contentType = req.headers.get('content-type') || '';
      const boundaryMatch = contentType.match(/boundary=([^\s;]+)/i);
      const rawArrayBuffer = await req.arrayBuffer();
      const rawBody = Buffer.from(rawArrayBuffer);

      if (boundaryMatch) {
        const boundary = boundaryMatch[1].replace(/^["']|["']$/g, '');
        const parts = parseMultipartBody(rawBody, boundary);
        const filePart = parts.find((p) => p.name === 'file' || p.name === 'document');
        if (filePart) {
          docBuffer = filePart.data;
          docOriginalName = filePart.filename || 'document.jpg';
          docMimeType = filePart.type || 'image/jpeg';
        }
        const personPart = parts.find((p) => p.name === 'person_photo' || p.name === 'person');
        if (personPart) {
          personBuffer = personPart.data;
          personOriginalName = personPart.filename || 'person.jpg';
          personMimeType = personPart.type || 'image/jpeg';
        }
        const typePart = parts.find((p) => p.name === 'document_type');
        if (typePart) documentType = typePart.data.toString().trim() || 'Passport';
        const officerPart = parts.find((p) => p.name === 'officer_id');
        if (officerPart) officerId = officerPart.data.toString().trim() || 'officer001';
      } else {
        docBuffer = rawBody;
      }
    }

    if (!docBuffer || docBuffer.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No document file uploaded in form field "file"',
          status: 'REJECTED',
          riskLevel: 'HIGH',
          reasons: ['No document file received by serverless function'],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const result = await executeVerificationPipeline({
      docBuffer,
      docOriginalName,
      docMimeType,
      docSize: docBuffer.length,
      personBuffer,
      personOriginalName,
      personMimeType,
      documentType,
      officerId,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('Error in /api/verify Netlify function:', err);
    return new Response(
      JSON.stringify({
        success: false,
        verificationId: `VER-${Date.now()}-ERR`,
        status: 'REJECTED',
        riskLevel: 'HIGH',
        risk_score: 95,
        confidence_score: 60,
        applicant_name: 'UNKNOWN',
        document_number: 'NOT_EXTRACTED',
        error: err.message || 'Document scanning error in serverless environment',
        reasons: [err.message || 'Serverless verification error occurred'],
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// AWS Lambda / Netlify v1 compatibility handler
export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body || '');

    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    const boundaryMatch = contentType.match(/boundary=([^\s;]+)/i);

    let docBuffer = rawBody;
    let docOriginalName = 'document.jpg';
    let docMimeType = 'image/jpeg';
    let personBuffer: Buffer | null = null;
    let personOriginalName: string | null = null;
    let personMimeType: string | null = null;
    let documentType = 'Passport';
    let officerId = 'officer001';

    if (boundaryMatch) {
      const boundary = boundaryMatch[1].replace(/^["']|["']$/g, '');
      const parts = parseMultipartBody(rawBody, boundary);

      const filePart = parts.find((p) => p.name === 'file' || p.name === 'document');
      if (filePart) {
        docBuffer = filePart.data;
        docOriginalName = filePart.filename || 'document.jpg';
        docMimeType = filePart.type || 'image/jpeg';
      }

      const personPart = parts.find((p) => p.name === 'person_photo' || p.name === 'person');
      if (personPart) {
        personBuffer = personPart.data;
        personOriginalName = personPart.filename || 'person.jpg';
        personMimeType = personPart.type || 'image/jpeg';
      }

      const typePart = parts.find((p) => p.name === 'document_type');
      if (typePart) {
        documentType = typePart.data.toString().trim() || 'Passport';
      }

      const officerPart = parts.find((p) => p.name === 'officer_id');
      if (officerPart) {
        officerId = officerPart.data.toString().trim() || 'officer001';
      }
    }

    const result = await executeVerificationPipeline({
      docBuffer,
      docOriginalName,
      docMimeType,
      docSize: docBuffer.length,
      personBuffer,
      personOriginalName,
      personMimeType,
      documentType,
      officerId,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    console.error('Error in verify handler:', err);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        verificationId: `VER-${Date.now()}-ERR`,
        status: 'REJECTED',
        riskLevel: 'HIGH',
        risk_score: 95,
        confidence_score: 60,
        applicant_name: 'UNKNOWN',
        document_number: 'NOT_EXTRACTED',
        error: err.message || 'Document scanning error in serverless environment',
        reasons: [err.message || 'Serverless verification error occurred'],
      }),
    };
  }
};
