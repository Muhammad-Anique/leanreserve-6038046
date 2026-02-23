/**
 * Availability Logic Utility
 * 
 * Implements the "Resource Bucket" calculation for LeanReserve.
 * Instead of complex floor plans, we treat restaurant capacity as
 * numerical inventory buckets (e.g., 5 tables of 2, 3 tables of 4).
 * 
 * Availability is calculated by:
 * 1. Finding table types that can accommodate the guest count
 * 2. Summing available quantity of those table types
 * 3. Subtracting bookings within the +/- 2-hour turnover window
 */

import { supabaseAdmin } from './supabase';

// Default turnover window in hours (before and after the requested time)
const DEFAULT_TURNOVER_HOURS = 2;

/**
 * Check if a table capacity can accommodate the guest count
 * A table of capacity N can seat 1 to N guests
 */
function canAccommodate(tableCapacity: number, guestCount: number): boolean {
  return tableCapacity >= guestCount;
}

/**
 * Calculate the time window for checking overlapping bookings
 * Returns start and end times in HH:MM:SS format
 */
function calculateTimeWindow(
  bookingTime: string,
  turnoverHours: number = DEFAULT_TURNOVER_HOURS
): { startTime: string; endTime: string } {
  const [hours, minutes] = bookingTime.split(':').map(Number);
  const bookingDate = new Date();
  bookingDate.setHours(hours, minutes, 0, 0);

  const startDate = new Date(bookingDate.getTime() - turnoverHours * 60 * 60 * 1000);
  const endDate = new Date(bookingDate.getTime() + turnoverHours * 60 * 60 * 1000);

  const formatTime = (date: Date) =>
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;

  return {
    startTime: formatTime(startDate),
    endTime: formatTime(endDate),
  };
}

/**
 * Check availability for a booking request
 * 
 * @param restaurantId - UUID of the restaurant
 * @param bookingDate - Date in YYYY-MM-DD format
 * @param bookingTime - Time in HH:MM format
 * @param guestCount - Number of guests
 * @returns Object with availability status and optional alternatives
 */
export async function checkAvailability({
  restaurantId,
  bookingDate,
  bookingTime,
  guestCount,
}: {
  restaurantId: string;
  bookingDate: string;
  bookingTime: string;
  guestCount: number;
}): Promise<{
  available: boolean;
  totalCapacity: number;
  bookedTables: number;
  remainingCapacity: number;
  alternatives?: string[];
}> {
  // 1. Get table inventory for the restaurant
  const { data: inventory, error: inventoryError } = await supabaseAdmin
    .from('table_inventory')
    .select('capacity, quantity')
    .eq('restaurant_id', restaurantId);

  if (inventoryError) {
    throw new Error(`Failed to fetch inventory: ${inventoryError.message}`);
  }

  if (!inventory || inventory.length === 0) {
    return {
      available: false,
      totalCapacity: 0,
      bookedTables: 0,
      remainingCapacity: 0,
      alternatives: [],
    };
  }

  // 2. Calculate total capacity from tables that can accommodate the guest count
  const suitableTables = inventory.filter((table) =>
    canAccommodate(table.capacity, guestCount)
  );

  const totalCapacity = suitableTables.reduce(
    (sum, table) => sum + table.quantity,
    0
  );

  if (totalCapacity === 0) {
    return {
      available: false,
      totalCapacity: 0,
      bookedTables: 0,
      remainingCapacity: 0,
      alternatives: [],
    };
  }

  // 3. Calculate time window for overlapping bookings
  const { startTime, endTime } = calculateTimeWindow(bookingTime);

  // 4. Count existing bookings in the time window
  const { count: bookedTables, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .eq('booking_date', bookingDate)
    .eq('status', 'confirmed')
    .gte('booking_time', startTime)
    .lte('booking_time', endTime);

  if (bookingsError) {
    throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
  }

  const remainingCapacity = totalCapacity - (bookedTables || 0);
  const available = remainingCapacity > 0;

  // 5. If not available, suggest alternative times
  let alternatives: string[] = [];
  if (!available) {
    alternatives = await findAlternativeTimes({
      restaurantId,
      bookingDate,
      guestCount,
      originalTime: bookingTime,
    });
  }

  return {
    available,
    totalCapacity,
    bookedTables: bookedTables || 0,
    remainingCapacity,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
  };
}

/**
 * Find alternative available times for the same day
 * Searches in 30-minute increments around the requested time
 */
async function findAlternativeTimes({
  restaurantId,
  bookingDate,
  guestCount,
  originalTime,
}: {
  restaurantId: string;
  bookingDate: string;
  guestCount: number;
  originalTime: string;
}): Promise<string[]> {
  const alternatives: string[] = [];
  const [originalHours, originalMinutes] = originalTime.split(':').map(Number);

  // Search in 30-minute increments for 2 hours before and after
  const searchOffsets = [-120, -90, -60, -30, 30, 60, 90, 120];

  for (const offset of searchOffsets) {
    const newDate = new Date();
    newDate.setHours(originalHours, originalMinutes + offset, 0, 0);

    // Skip if outside business hours (assuming 11:00 - 22:00)
    if (newDate.getHours() < 11 || newDate.getHours() >= 22) {
      continue;
    }

    const alternativeTime = `${String(newDate.getHours()).padStart(2, '0')}:${String(
      newDate.getMinutes()
    ).padStart(2, '0')}`;

    const result = await checkAvailability({
      restaurantId,
      bookingDate,
      bookingTime: alternativeTime,
      guestCount,
    });

    if (result.available) {
      alternatives.push(alternativeTime);
    }

    // Limit to 3 suggestions
    if (alternatives.length >= 3) {
      break;
    }
  }

  return alternatives;
}

/**
 * Validate if a booking can be made
 * Returns detailed information about why a booking might fail
 */
export async function validateBooking({
  restaurantId,
  bookingDate,
  bookingTime,
  guestCount,
}: {
  restaurantId: string;
  bookingDate: string;
  bookingTime: string;
  guestCount: number;
}): Promise<{
  valid: boolean;
  reason?: string;
  availability: Awaited<ReturnType<typeof checkAvailability>>;
}> {
  // Validate guest count
  if (guestCount <= 0) {
    return {
      valid: false,
      reason: 'Guest count must be at least 1',
      availability: {
        available: false,
        totalCapacity: 0,
        bookedTables: 0,
        remainingCapacity: 0,
      },
    };
  }

  // Validate date is not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const requestedDate = new Date(bookingDate);

  if (requestedDate < today) {
    return {
      valid: false,
      reason: 'Booking date cannot be in the past',
      availability: {
        available: false,
        totalCapacity: 0,
        bookedTables: 0,
        remainingCapacity: 0,
      },
    };
  }

  // Check availability
  const availability = await checkAvailability({
    restaurantId,
    bookingDate,
    bookingTime,
    guestCount,
  });

  if (!availability.available) {
    return {
      valid: false,
      reason:
        availability.totalCapacity === 0
          ? 'No tables available for this party size'
          : 'No availability for the requested time',
      availability,
    };
  }

  return {
    valid: true,
    availability,
  };
}