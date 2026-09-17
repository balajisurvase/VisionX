import { getDashboardMetrics } from '../../supabaseService';

export default async function (req: Request) {
  try {
    const metrics = await getDashboardMetrics();
    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('Error in /api/dashboard function:', err);
    return new Response(
      JSON.stringify({
        error: err.message || 'Failed to retrieve dashboard metrics',
        total_screenings: 0,
        verified_count: 0,
        suspicious_count: 0,
        failed_count: 0,
        recent_verifications: [],
      }),
      {
        status: 200, // Return valid JSON fallback with 200 to keep dashboard alive
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
    const metrics = await getDashboardMetrics();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(metrics),
    };
  } catch (err: any) {
    console.error('Error in dashboard handler:', err);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: err.message || 'Failed to retrieve dashboard metrics',
        total_screenings: 0,
        verified_count: 0,
        suspicious_count: 0,
        failed_count: 0,
        recent_verifications: [],
      }),
    };
  }
};
