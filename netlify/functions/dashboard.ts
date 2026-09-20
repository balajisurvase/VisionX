import { getDashboardMetrics } from '../../supabaseService';

export default async function (req: Request) {
  try {
    const metrics = await getDashboardMetrics();
    const payload = {
      success: true,
      totalVerifications: metrics.total_screenings || 0,
      verified: metrics.verified_count || 0,
      failed: metrics.failed_count || 0,
      highRisk: (metrics as any).high_risk_count ?? metrics.failed_count ?? 0,
      pending: (metrics as any).pending_count || 0,
      total_screenings: metrics.total_screenings || 0,
      verified_count: metrics.verified_count || 0,
      suspicious_count: metrics.suspicious_count || 0,
      failed_count: metrics.failed_count || 0,
      recent_verifications: metrics.recent_verifications || [],
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
    console.error('Error in /api/dashboard function:', err);
    return new Response(
      JSON.stringify({
        success: true,
        totalVerifications: 0,
        verified: 0,
        failed: 0,
        highRisk: 0,
        pending: 0,
        total_screenings: 0,
        verified_count: 0,
        suspicious_count: 0,
        failed_count: 0,
        recent_verifications: [],
        error: err.message || 'Supabase retrieval error',
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
    const metrics = await getDashboardMetrics();
    const payload = {
      success: true,
      totalVerifications: metrics.total_screenings || 0,
      verified: metrics.verified_count || 0,
      failed: metrics.failed_count || 0,
      highRisk: (metrics as any).high_risk_count ?? metrics.failed_count ?? 0,
      pending: (metrics as any).pending_count || 0,
      total_screenings: metrics.total_screenings || 0,
      verified_count: metrics.verified_count || 0,
      suspicious_count: metrics.suspicious_count || 0,
      failed_count: metrics.failed_count || 0,
      recent_verifications: metrics.recent_verifications || [],
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
    console.error('Error in dashboard handler:', err);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        totalVerifications: 0,
        verified: 0,
        failed: 0,
        highRisk: 0,
        pending: 0,
        total_screenings: 0,
        verified_count: 0,
        suspicious_count: 0,
        failed_count: 0,
        recent_verifications: [],
        error: err.message || 'Supabase retrieval error',
      }),
    };
  }
};
