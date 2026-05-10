import { defineStore } from 'pinia';
import { ref } from 'vue';
import axiosInstance from '../utils/axios.config';

export interface Review {
  _id: string;
  propertyId: {
    _id: string;
    title: string;
    images: { url: string; isMain: boolean }[];
  };
  userId: {
    _id: string;
    name: string;
    avatar: string;
  };
  bookingId: string;
  rating: number;
  comment: string;
  images?: string[];
  hostResponse?: {
    comment: string;
    createdAt: string;
  };
  helpful: number;
  createdAt: string;
  isEdited: boolean;
}

export const useReviewStore = defineStore('review', () => {
  const reviews = ref<Review[]>([]);
  const loading = ref(false);
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const stats = ref({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  async function fetchPropertyReviews(propertyId: string, page = 1) {
    loading.value = true;
    try {
      const response = await axiosInstance.get(`/reviews/property/${propertyId}`, {
        params: { page, limit: 10 }
      });
      reviews.value = response.data.reviews;
      pagination.value = response.data.pagination;
      stats.value = response.data.stats;
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function createReview(reviewData: any) {
    loading.value = true;
    try {
      const response = await axiosInstance.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMyReviews() {
    loading.value = true;
    try {
      const response = await axiosInstance.get('/reviews/my-reviews');
      reviews.value = response.data;
      return response.data;
    } catch (error) {
      console.error('Error fetching my reviews:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updateReview(id: string, reviewData: any) {
    loading.value = true;
    try {
      const response = await axiosInstance.put(`/reviews/${id}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function deleteReview(id: string) {
    loading.value = true;
    try {
      await axiosInstance.delete(`/reviews/${id}`);
      reviews.value = reviews.value.filter(r => r._id !== id);
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function respondToReview(id: string, response: string) {
    loading.value = true;
    try {
      const res = await axiosInstance.post(`/reviews/${id}/respond`, { response });
      const index = reviews.value.findIndex(r => r._id === id);
      if (index !== -1) {
        reviews.value[index].hostResponse = res.data.review.hostResponse;
      }
      return res.data;
    } catch (error) {
      console.error('Error responding to review:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function markHelpful(id: string) {
    try {
      const response = await axiosInstance.post(`/reviews/${id}/helpful`);
      const index = reviews.value.findIndex(r => r._id === id);
      if (index !== -1) {
        reviews.value[index].helpful = response.data.helpful;
      }
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  }

  return {
    reviews,
    loading,
    pagination,
    stats,
    fetchPropertyReviews,
    createReview,
    fetchMyReviews,
    updateReview,
    deleteReview,
    respondToReview,
    markHelpful
  };
});