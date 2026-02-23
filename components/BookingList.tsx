'use client';

import React, { useState, useMemo } from 'react';
import { Booking } from '@/types';
import { BookingStatusBadge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface BookingListProps {
  initialBookings: Booking[];
}

export function BookingList({ initialBookings }: BookingListProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Client-side filtering
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // Status filter
      if (statusFilter !== 'all' && booking.status !== statusFilter) {
        return false;
      }

      // Search filter (name or email)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = booking.customer_name
          .toLowerCase()
          .includes(searchLower);
        const matchesEmail = booking.customer_email
          .toLowerCase()
          .includes(searchLower);
        const matchesTime = booking.booking_time
          .slice(0, 5)
          .includes(searchTerm);

        return matchesName || matchesEmail || matchesTime;
      }

      return true;
    });
  }, [bookings, searchTerm, statusFilter]);

  // Update booking status
  const updateStatus = async (
    bookingId: string,
    newStatus: Booking['status']
  ) => {
    setIsUpdating(bookingId);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update booking');
      }

      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking status');
    } finally {
      setIsUpdating(null);
    }
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bookings today
          </h3>
          <p className="text-gray-500">
            When customers make reservations, they&apos;ll appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Today&apos;s Reservations</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="Search by name, email, or time..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Time
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Customer
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Guests
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium">
                    {formatTime(booking.booking_time)}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.customer_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.customer_email}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {booking.guest_count}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <BookingStatusBadge status={booking.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {booking.status === 'confirmed' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              updateStatus(booking.id, 'completed')
                            }
                            disabled={isUpdating === booking.id}
                          >
                            Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatus(booking.id, 'cancelled')
                            }
                            disabled={isUpdating === booking.id}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {booking.status === 'cancelled' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            updateStatus(booking.id, 'confirmed')
                          }
                          disabled={isUpdating === booking.id}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No bookings match your search criteria.
          </div>
        )}
      </CardContent>
    </Card>
  );
}