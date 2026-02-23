import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

/**
 * Supabase Edge Function: send-confirmation
 * 
 * Sends booking confirmation emails using the Resend API.
 * Triggered by database webhooks when a new booking is created.
 * 
 * Environment Variables:
 * - RESEND_API_KEY: Your Resend API key
 * - FROM_EMAIL: The sender email address (must be verified in Resend)
 */

interface BookingPayload {
  type: 'INSERT';
  table: 'bookings';
  record: {
    id: string;
    restaurant_id: string;
    customer_name: string;
    customer_email: string;
    booking_date: string;
    booking_time: string;
    guest_count: number;
    status: string;
  };
}

interface RestaurantInfo {
  name: string;
  email: string;
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'bookings@leanreserve.app';

serve(async (req: Request) => {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse the webhook payload
    const payload: BookingPayload = await req.json();

    // Only process INSERT events for confirmed bookings
    if (payload.type !== 'INSERT' || payload.record.status !== 'confirmed') {
      return new Response(
        JSON.stringify({ message: 'Event skipped' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const booking = payload.record;

    // Fetch restaurant info
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const restaurantResponse = await fetch(
      `${supabaseUrl}/rest/v1/restaurants?id=eq.${booking.restaurant_id}&select=name,email`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
        },
      }
    );

    if (!restaurantResponse.ok) {
      throw new Error('Failed to fetch restaurant info');
    }

    const restaurants: RestaurantInfo[] = await restaurantResponse.json();
    const restaurant = restaurants[0];

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Format date and time for email
    const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = formatTime(booking.booking_time);

    // Send email via Resend
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set, skipping email send');
      return new Response(
        JSON.stringify({ message: 'Email skipped - no API key' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${restaurant.name} <${FROM_EMAIL}>`,
        to: booking.customer_email,
        subject: `Booking Confirmation - ${restaurant.name}`,
        html: generateEmailTemplate({
          customerName: booking.customer_name,
          restaurantName: restaurant.name,
          date: formattedDate,
          time: formattedTime,
          guestCount: booking.guest_count,
        }),
        text: generatePlainTextEmail({
          customerName: booking.customer_name,
          restaurantName: restaurant.name,
          date: formattedDate,
          time: formattedTime,
          guestCount: booking.guest_count,
        }),
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Confirmation email sent',
        emailId: emailData.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Format time from HH:MM:SS to human-readable format
 */
function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Generate HTML email template
 */
function generateEmailTemplate({
  customerName,
  restaurantName,
  date,
  time,
  guestCount,
}: {
  customerName: string;
  restaurantName: string;
  date: string;
  time: string;
  guestCount: number;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .booking-details {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: 600;
      color: #6b7280;
    }
    .value {
      font-weight: 500;
      color: #111827;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Booking Confirmed! 🎉</h1>
    <p>Thank you for choosing ${restaurantName}</p>
  </div>
  
  <div class="content">
    <p>Hello ${customerName},</p>
    
    <p>Your reservation has been confirmed. Here are your booking details:</p>
    
    <div class="booking-details">
      <div class="detail-row">
        <span class="label">Restaurant</span>
        <span class="value">${restaurantName}</span>
      </div>
      <div class="detail-row">
        <span class="label">Date</span>
        <span class="value">${date}</span>
      </div>
      <div class="detail-row">
        <span class="label">Time</span>
        <span class="value">${time}</span>
      </div>
      <div class="detail-row">
        <span class="label">Guests</span>
        <span class="value">${guestCount} ${guestCount === 1 ? 'person' : 'people'}</span>
      </div>
    </div>
    
    <p>We look forward to seeing you! If you need to make any changes to your reservation, please contact the restaurant directly.</p>
    
    <div class="footer">
      <p>This is an automated confirmation email. Please do not reply to this message.</p>
      <p>© ${new Date().getFullYear()} ${restaurantName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text email version
 */
function generatePlainTextEmail({
  customerName,
  restaurantName,
  date,
  time,
  guestCount,
}: {
  customerName: string;
  restaurantName: string;
  date: string;
  time: string;
  guestCount: number;
}): string {
  return `
Hello ${customerName},

Your reservation at ${restaurantName} has been confirmed!

BOOKING DETAILS:
- Restaurant: ${restaurantName}
- Date: ${date}
- Time: ${time}
- Guests: ${guestCount} ${guestCount === 1 ? 'person' : 'people'}

We look forward to seeing you! If you need to make any changes to your reservation, please contact the restaurant directly.

---
This is an automated confirmation email. Please do not reply to this message.
© ${new Date().getFullYear()} ${restaurantName}. All rights reserved.
  `.trim();
}