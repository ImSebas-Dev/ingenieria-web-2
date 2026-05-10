import { defineStore } from 'pinia';
import axiosInstance from '../utils/axios.config';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface Property {
  _id: string;
  title: string;
  type: string;
  isActive: boolean;
  isVerified: boolean;
  hostId: { name: string; email: string };
  location: { city: string; department: string };
  pricePerNight: number;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
}

interface Booking {
  _id: string;
  propertyId: { title: string; _id: string };
  turistaId: { name: string; email: string };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface Review {
  _id: string;
  propertyId: { title: string; _id: string };
  userId: { name: string; email: string };
  rating: number;
  comment: string;
  helpful: number;
  reported: boolean;
  status: string;
  createdAt: string;
}

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  activeProperties: number;
  pendingProperties: number;
  confirmedBookings: number;
  completedBookings: number;
  recentUsers: User[];
  recentBookings: Booking[];
  monthlyStats: Array<{ month: string; bookings: number; revenue: number }>;
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    stats: null as DashboardStats | null,
    users: [] as User[],
    properties: [] as Property[],
    bookings: [] as Booking[],
    reviews: [] as Review[],
    loading: false,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    }
  }),

  actions: {
    async fetchDashboardStats() {
      this.loading = true;
      try {
        const response = await axiosInstance.get('/admin/stats');
        this.stats = response.data;
        return response.data;
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchUsers(page = 1, limit = 20, filters = {}) {
      this.loading = true;
      try {
        const response = await axiosInstance.get('/admin/users', {
          params: { page, limit, ...filters }
        });
        this.users = response.data.users;
        this.pagination = response.data.pagination;
        return response.data;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateUserRole(userId: string, role: string) {
      this.loading = true;
      try {
        const response = await axiosInstance.put(`/admin/users/${userId}/role`, { role });
        const index = this.users.findIndex(u => u._id === userId);
        if (index !== -1) {
          this.users[index].role = role;
        }
        return response.data;
      } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async toggleUserStatus(userId: string, isActive: boolean) {
      this.loading = true;
      try {
        const response = await axiosInstance.put(`/admin/users/${userId}/status`, { isActive });
        const index = this.users.findIndex(u => u._id === userId);
        if (index !== -1) {
          this.users[index].isActive = isActive;
        }
        return response.data;
      } catch (error) {
        console.error('Error toggling user status:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchProperties(page = 1, limit = 20, filters = {}) {
      this.loading = true;
      try {
        const response = await axiosInstance.get('/admin/properties', {
          params: { page, limit, ...filters }
        });
        this.properties = response.data.properties;
        this.pagination = response.data.pagination;
        return response.data;
      } catch (error) {
        console.error('Error fetching properties:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async togglePropertyStatus(propertyId: string, isActive: boolean) {
      this.loading = true;
      try {
        const response = await axiosInstance.put(`/admin/properties/${propertyId}/status`, { isActive });
        const index = this.properties.findIndex(p => p._id === propertyId);
        if (index !== -1) {
          this.properties[index].isActive = isActive;
        }
        return response.data;
      } catch (error) {
        console.error('Error toggling property status:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async togglePropertyVerification(propertyId: string, isVerified: boolean) {
      this.loading = true;
      try {
        const response = await axiosInstance.put(`/admin/properties/${propertyId}/verify`, { isVerified });
        const index = this.properties.findIndex(p => p._id === propertyId);
        if (index !== -1) {
          this.properties[index].isVerified = isVerified;
        }
        return response.data;
      } catch (error) {
        console.error('Error toggling property verification:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchBookings(page = 1, limit = 20, filters = {}) {
      this.loading = true;
      try {
        const response = await axiosInstance.get('/admin/bookings', {
          params: { page, limit, ...filters }
        });
        this.bookings = response.data.bookings;
        this.pagination = response.data.pagination;
        return response.data;
      } catch (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchReviews(page = 1, limit = 20, filters = {}) {
      this.loading = true;
      try {
        const response = await axiosInstance.get('/admin/reviews', {
          params: { page, limit, ...filters }
        });
        this.reviews = response.data.reviews;
        this.pagination = response.data.pagination;
        return response.data;
      } catch (error) {
        console.error('Error fetching reviews:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async moderateReview(reviewId: string, action: 'approve' | 'remove' | 'flag') {
      this.loading = true;
      try {
        const response = await axiosInstance.put(`/admin/reviews/${reviewId}/moderate`, { action });
        const index = this.reviews.findIndex(r => r._id === reviewId);
        if (index !== -1) {
          if (action === 'remove') {
            this.reviews.splice(index, 1);
          } else {
            this.reviews[index].status = action === 'approve' ? 'active' : 'flagged';
          }
        }
        return response.data;
      } catch (error) {
        console.error('Error moderating review:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});