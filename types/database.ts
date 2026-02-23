/**
 * Supabase Database Types
 * Generated based on the LeanReserve schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          name: string;
          email: string;
          timezone: string;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          timezone?: string;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          timezone?: string;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      table_inventory: {
        Row: {
          id: string;
          restaurant_id: string;
          capacity: number;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          capacity: number;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          capacity?: number;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          restaurant_id: string;
          customer_name: string;
          customer_email: string;
          booking_date: string;
          booking_time: string;
          guest_count: number;
          status: 'confirmed' | 'cancelled' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          customer_name: string;
          customer_email: string;
          booking_date: string;
          booking_time: string;
          guest_count: number;
          status?: 'confirmed' | 'cancelled' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          customer_name?: string;
          customer_email?: string;
          booking_date?: string;
          booking_time?: string;
          guest_count?: number;
          status?: 'confirmed' | 'cancelled' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}