import { executeVerificationPipeline } from '../../verificationEngine';

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
    const formData = await req.formData();
    const docFile = formData.get('file') as File | null;
    const personFile = formData.get('person_photo') as File | null;
    const documentType = (formData.get('document_type') as string) || 'Passport';
    const officerId = (formData.get('officer_id') as string) || 'officer001';

    if (!docFile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No document file uploaded in form field "file"',
          status: 'REJECTED',
          riskLevel: 'HIGH',
          reasons: ['No document file provided'],
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const docArrayBuf = await docFile.arrayBuffer();
    const docBuffer = Buffer.from(docArrayBuf);

    let personBuffer: Buffer | null = null;
    let personOriginalName: string | null = null;
    let personMimeType: string | null = null;

    if (personFile && typeof personFile.arrayBuffer === 'function') {
      const pArrayBuf = await personFile.arrayBuffer();
      personBuffer = Buffer.from(pArrayBuf);
      personOriginalName = personFile.name;
      personMimeType = personFile.type;
    }

    const result = await executeVerificationPipeline({
      docBuffer,
      docOriginalName: docFile.name || 'document.jpg',
      docMimeType: docFile.type || 'image/jpeg',
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
        status: 'REJECTED',
        riskLevel: 'HIGH',
        error: err.message || 'Internal screening error',
        reasons: [err.message || 'Document processing failure'],
      }),
      {
        status: 500,
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
    // For v1 base64 encoded multipart, parse body
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body || '');

    const result = await executeVerificationPipeline({
      docBuffer: bodyBuffer,
      docOriginalName: 'document.jpg',
      docMimeType: 'image/jpeg',
      docSize: bodyBuffer.length,
      documentType: 'Passport',
      officerId: 'officer001',
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
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        status: 'REJECTED',
        riskLevel: 'HIGH',
        error: err.message || 'Internal screening error',
        reasons: [err.message || 'Verification failure'],
      }),
    };
  }
};
