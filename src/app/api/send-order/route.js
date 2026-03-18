import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const order = await request.json();

    const mealsHtml = order.meals
      .map(m => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${m.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${m.qty}×</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${m.price * m.qty} Kč</td></tr>`)
      .join('');

    const addressHtml = order.customer.street
      ? `<p><strong>Adresa:</strong> ${order.customer.street}, ${order.customer.city} ${order.customer.zip}</p>`
      : '';

    const noteHtml = order.customer.note
      ? `<p><strong>Poznámka:</strong> <em>${order.customer.note}</em></p>`
      : '';

    const htmlContent = `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <div style="background:#e85d26;color:#fff;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;">🍜 Nová objednávka</h1>
          <p style="margin:8px 0 0;opacity:0.9;">${order.orderNumber}</p>
        </div>

        <div style="padding:24px;background:#fff;border:1px solid #e8e5e0;">
          <h2 style="color:#1a1a2e;font-size:18px;margin-top:0;">Datum objednávky</h2>
          <p>${order.dateFull}</p>

          <h2 style="color:#1a1a2e;font-size:18px;">Objednaná jídla</h2>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#faf8f5;">
                <th style="padding:8px;text-align:left;">Jídlo</th>
                <th style="padding:8px;text-align:center;">Počet</th>
                <th style="padding:8px;text-align:right;">Cena</th>
              </tr>
            </thead>
            <tbody>${mealsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:12px 8px;font-weight:700;font-size:16px;">Celkem</td>
                <td style="padding:12px 8px;font-weight:700;font-size:16px;text-align:right;color:#e85d26;">${order.total} Kč</td>
              </tr>
            </tfoot>
          </table>

          <h2 style="color:#1a1a2e;font-size:18px;">Kontaktní údaje</h2>
          <p><strong>Jméno:</strong> ${order.customer.firstName} ${order.customer.lastName}</p>
          <p><strong>E-mail:</strong> ${order.customer.email}</p>
          <p><strong>Telefon:</strong> ${order.customer.phone}</p>
          ${addressHtml}
          ${noteHtml}

          <h2 style="color:#1a1a2e;font-size:18px;">Platba</h2>
          <p>${order.payment === 'cash' ? 'Hotově při převzetí' : 'Bankovní převod'}</p>
        </div>

        <div style="background:#faf8f5;padding:16px 24px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e8e5e0;border-top:none;">
          <p style="margin:0;color:#999;font-size:13px;">Lin's Happy Bowl – Domácí jídla připravená s láskou</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Lin\'s Happy Bowl <onboarding@resend.dev>',
      to: [process.env.ORDER_EMAIL || 'jirka.leanh@gmail.com'],
      subject: `Nová objednávka ${order.orderNumber} – ${order.customer.firstName} ${order.customer.lastName}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, id: data.id });
  } catch (err) {
    console.error('API error:', err);
    return Response.json({ error: 'Nepodařilo se odeslat email.' }, { status: 500 });
  }
}
