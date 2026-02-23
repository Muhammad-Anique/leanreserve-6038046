import { BookingForm } from '@/components/BookingForm';

/**
 * Public Web Booking Form Page
 * 
 * This page provides a simple, accessible booking form for customers.
 * The restaurant ID is currently hardcoded for the MVP - in production,
 * this would come from a subdomain or URL parameter.
 */
export default function BookPage() {
  // For MVP, using a hardcoded restaurant ID
  // In production, this would come from: subdomain, URL param, or context
  const RESTAURANT_ID = '00000000-0000-0000-0000-000000000000';

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Make a Reservation
          </h1>
          <p className="mt-2 text-gray-600">
            Book your table quickly and easily
          </p>
        </div>

        <BookingForm restaurantId={RESTAURANT_ID} />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need help? Contact us at{' '}
            <a
              href="mailto:reservations@example.com"
              className="text-blue-600 hover:underline"
            >
              reservations@example.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}