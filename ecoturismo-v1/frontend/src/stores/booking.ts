import { defineStore } from 'pinia';
import { ref } from 'vue';
import axiosInstance from '../utils/axios.config';

export interface Booking {
  _id: string;
  propertyId: {
    _id: string;
    title: string;
    images: { url: string; isMain: boolean }[];
    location: any;
    pricePerNight: number;
  };
  turistaId: {
    _id: string;
    name: string;
    email: string;
    avatar: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  specialRequests?: string;
  createdAt: string;
}

export const useBookingStore = defineStore('booking', () => {
  const myBookings = ref<Booking[]>([]);
  const hostBookings = ref<Booking[]>([]);
  const loading = ref(false);
  const currentBooking = ref<Booking | null>(null);

  async function createBooking(bookingData: any) {
    loading.value = true;
    try {
      const response = await axiosInstance.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMyBookings() {
    loading.value = true;
    try {
      const response = await axiosInstance.get('/bookings/my-bookings');
      myBookings.value = response.data;
    } catch (error) {
      console.error('Error fetching my bookings:', error);
    } finally {
      loading.value = false;
    }
  }

  async function fetchHostBookings() {
    loading.value = true;
    try {
      const response = await axiosInstance.get('/bookings/host-bookings');
      hostBookings.value = response.data;
      return response.data;
    } catch (error) {
      console.error('Error fetching host bookings:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function confirmBooking(id: string, paymentId: string) {
    loading.value = true;
    try {
      const response = await axiosInstance.put(`/bookings/${id}/confirm`, { paymentId });
      return response.data;
    } catch (error) {
      console.error('Error confirming booking:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function cancelBooking(id: string, reason?: string) {
    loading.value = true;
    try {
      const response = await axiosInstance.put(`/bookings/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function completeBooking(id: string) {
    loading.value = true;
    try {
      const response = await axiosInstance.put(`/bookings/${id}/complete`);
      return response.data;
    } catch (error) {
      console.error('Error completing booking:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function checkAvailability(propertyId: string, checkIn: string, checkOut: string) {
    try {
      const response = await axiosInstance.get('/bookings/check-availability', {
        params: { propertyId, checkIn, checkOut }
      });
      return response.data.available;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }

  async function getBlockedDates(propertyId: string, start?: string, end?: string) {
    try {
      const response = await axiosInstance.get(`/bookings/properties/${propertyId}/blocked-dates`, {
        params: { start, end }
      });
      return response.data.blockedDates;
    } catch (error) {
      console.error('Error getting blocked dates:', error);
      return [];
    }
  }

  return {
    myBookings,
    hostBookings,
    loading,
    currentBooking,
    createBooking,
    fetchMyBookings,
    fetchHostBookings,
    confirmBooking,
    cancelBooking,
    completeBooking,
    checkAvailability,
    getBlockedDates
  };
});