export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const order = await request.json();
    console.log('Order received:', order.orderNumber);

    // Resend email will be re-enabled after deployment is verified
    return Response.json({ success: true, id: 'test' });
  } catch (err) {
    console.error('API error:', err);
    return Response.json({ error: 'Nepodařilo se odeslat email.' }, { status: 500 });
  }
}
