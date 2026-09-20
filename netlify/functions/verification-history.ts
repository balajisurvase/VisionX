import { fetchVerificationHistory } from '../../supabaseService';

export default async function (req: Request) {
  try {
    const history = await fetchVerificationHistory();
    const records = Array.isArray(history) ? history : [];
    const payload = {
      success: true,
      total: records.length,
      records,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('Error in /api/verification/history function:', err);
    return new Response(
      JSON.stringify({
        success: true,
        total: 0,
        records: [],
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
export const handler = async (event: any, context: any) => {
  try {
    const history = await fetchVerificationHistory();
    const records = Array.isArray(history) ? history : [];
    const payload = {
      success: true,
      total: records.length,
      records,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(payload),
    };
  } catch (err: any) {
    console.error('Error in verification-history handler:', err);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        total: 0,
        records: [],
      }),
    };
  }
};
