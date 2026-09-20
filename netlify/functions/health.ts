export default async function (req: Request) {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'VisionX - Identity & Document Verification System',
      timestamp: new Date().toISOString(),
      hosting: 'Netlify Serverless Functions',
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

export const handler = async () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      status: 'ok',
      service: 'VisionX - Identity & Document Verification System',
      timestamp: new Date().toISOString(),
      hosting: 'Netlify Serverless Functions',
    }),
  };
};
