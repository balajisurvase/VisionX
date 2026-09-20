import path from 'path';
import fs from 'fs';
import os from 'os';
import { portraitMemoryCache } from '../../verificationEngine';
import { getClient } from '../../supabaseService';

function parsePathParams(urlOrPath: string): { id: string | null; type: string | null } {
  try {
    const cleanPath = urlOrPath.split('?')[0];
    const match = cleanPath.match(/\/api\/verifications\/([^\/]+)\/image\/([^\/]+)/i);
    if (match) {
      return { id: match[1], type: match[2] };
    }
    // Fallback match for /api/verifications/:id
    const singleMatch = cleanPath.match(/\/api\/verifications\/([^\/]+)/i);
    if (singleMatch) {
      return { id: singleMatch[1], type: 'portrait' };
    }
  } catch (e) {
    // Ignore parse errors
  }
  return { id: null, type: null };
}

async function getImageBuffer(id: string, type: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const normType = (type || 'portrait').toLowerCase();
  let filename = 'uploaded-passport.jpg';
  if (normType === 'portrait' || normType === 'face') filename = 'uploaded-passport-portrait.jpg';
  else if (normType === 'mrz') filename = 'mrz-crop.jpg';
  else if (normType === 'person' || normType === 'selfie' || normType === 'biometric') filename = 'uploaded-person.jpg';

  // 1. Check in-memory portrait cache
  if (normType === 'portrait' || normType === 'face') {
    const cached = portraitMemoryCache.get(id);
    if (cached) {
      return cached;
    }
  }

  // 2. Check local directories (both workspace and OS temp directory)
  const candidatePaths = [
    path.join(process.cwd(), 'uploads', 'verifications', id, filename),
    path.join(os.tmpdir(), 'uploads', 'verifications', id, filename),
    path.join(os.tmpdir(), 'verifications', id, filename),
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const buf = await fs.promises.readFile(p);
        return { buffer: buf, mimeType: 'image/jpeg' };
      }
    } catch (e) {
      // Continue to next path
    }
  }

  // 3. Check Supabase Storage and media table if available
  try {
    const sb = getClient();
    if (sb) {
      const candidatePaths = [
        `portraits/${id}/passport-portrait.jpg`,
        `documents/${id}/uploaded-passport.jpg`,
        `biometrics/${id}/uploaded-person.jpg`,
        `mrz/${id}/mrz-crop.jpg`,
        `verifications/${id}/${filename}`,
      ];

      for (const sp of candidatePaths) {
        const { data, error } = await sb.storage.from('verification-documents').download(sp);
        if (!error && data) {
          const arrayBuf = await data.arrayBuffer();
          return { buffer: Buffer.from(arrayBuf), mimeType: data.type || 'image/jpeg' };
        }
      }
    }
  } catch (e) {
    // Supabase download non-fatal
  }

  return null;
}

// Netlify v2 standard Web Request handler
export default async function (req: Request) {
  const { id, type } = parsePathParams(req.url);

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Verification ID missing in URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await getImageBuffer(id, type || 'portrait');

  if (!result) {
    return new Response(JSON.stringify({ success: false, error: `Portrait artifact not found for ${id}` }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
      },
    });
  }

  return new Response(result.buffer, {
    status: 200,
    headers: {
      'Content-Type': result.mimeType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// AWS Lambda / Netlify v1 compatibility handler
export const handler = async (event: any) => {
  const reqPath = event.path || event.rawUrl || '';
  const { id, type } = parsePathParams(reqPath);

  if (!id) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: 'Verification ID missing in URL' }),
    };
  }

  const result = await getImageBuffer(id, type || 'portrait');

  if (!result) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: false, error: `Portrait artifact not found for ${id}` }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': result.mimeType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
    body: result.buffer.toString('base64'),
    isBase64Encoded: true,
  };
};
