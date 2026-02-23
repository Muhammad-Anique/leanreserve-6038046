# Implementation Tasks: LeanReserve

This document outlines the sequential steps for the implementation of the LeanReserve Headless Booking Engine.

- [ ] **Task 1: Basic Project Structure and Types**
  Define TypeScript interfaces based on the database schema.
  - Create `types/index.ts` with interfaces for `Restaurant`, `TableInventory`, `Booking`, and `BookingStatus`.
  - Create `types/api.ts` for ElevenLabs request/response structures.

- [ ] **Task 2: Supabase Client Configuration**
  Initialize the Supabase client for frontend and backend use.
  - Create `lib/supabase.ts` using `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.

- [ ] **Task 3: Utility Library for Availability Logic**
  Implement the core "Resource Bucket" calculation logic.
  - Create `lib/availability.ts` to calculate if a booking is possible based on `table_inventory` quantity vs existing `bookings` within a 2-hour window.

- [ ] **Task 4: Shared UI Components (Atom Layer)**
  Build reusable design tokens using Tailwind CSS.
  - Create `components/ui/` with Button, Input, Card, and Badge components.

- [ ] **Task 5: Public Web Booking Form**
  The customer-facing interface for making reservations.
  - Create `app/book/page.tsx` and `components/BookingForm.tsx`.
  - Implement validation and success state with the confirmation message specified in the PRD.

- [ ] **Task 6: ElevenLabs AI Agent API Endpoint**
  Provide a headless interface for voice agent bookings.
  - Create `app/api/external/elevenlabs/booking/route.ts`.
  - Implement availability check and record insertion using the service role key where necessary.

- [ ] **Task 7: Staff Dashboard: Booking List**
  The main administrative view for restaurant staff.
  - Create `app/dashboard/page.tsx`.
  - Implement server-side fetching of daily bookings with client-side filtering (Name, Time).

- [ ] **Task 8: Inventory Configuration Interface**
  Management UI for "Resource Buckets."
  - Create `app/settings/page.tsx` and `components/InventoryManager.tsx`.
  - Allow staff to update `quantity` for different `capacity` types (2-tops, 4-tops, etc.).

- [ ] **Task 9: Automated Email Notification (Edge Function)**
  Handle post-booking English confirmation emails.
  - Create `supabase/functions/send-confirmation/index.ts`.
  - Integrate with Resend API using `process.env.RESEND_API_KEY`.

- [ ] **Task 10: README and Final Documentation**
  Document the system architecture and deployment instructions.
  - Update `README.md` with project overview, local development setup (mentioning required `.env.example` vars), and API usage for the ElevenLabs endpoint.