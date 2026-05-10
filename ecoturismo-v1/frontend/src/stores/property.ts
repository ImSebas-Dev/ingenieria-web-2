import { defineStore } from 'pinia';
import { ref } from 'vue';
import axiosInstance from '../utils/axios.config';

export interface Property {
  _id: string;
  title: string;
  description: string;
  type: string;
  hostId: {
    _id: string;
    name: string;
    email: string;
    avatar: string;
  };
  location: {
    coordinates: [number, number];
    address: string;
    city: string;
    department: string;
    country: string;
  };
  amenities: string[];
  images: { url: string; publicId: string; isMain: boolean }[];
  pricePerNight: number;
  capacity: { adults: number; children: number; extraBeds: number };
  bedrooms: number;
  bathrooms: number;
  averageRating: number;
  totalReviews: number;
  views: number;
  isActive: boolean;
}

export const usePropertyStore = defineStore('property', () => {
  const properties = ref<Property[]>([]);
  const currentProperty = ref<Property | null>(null);
  const loading = ref(false);
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  async function fetchProperties(filters: any = {}) {
    loading.value = true;
    try {
      const params = new URLSearchParams(filters);
      const response = await axiosInstance.get(`/properties?${params}`);
      properties.value = response.data.properties;
      pagination.value = response.data.pagination;
      return response.data;
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPropertyById(id: string) {
    loading.value = true;
    try {
      const response = await axiosInstance.get(`/properties/${id}`);
      currentProperty.value = response.data;
      return response.data;
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function createProperty(propertyData: Partial<Property>) {
    loading.value = true;
    try {
      const response = await axiosInstance.post('/properties', propertyData);
      return response.data;
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updateProperty(id: string, propertyData: Partial<Property>) {
    loading.value = true;
    try {
      const response = await axiosInstance.put(`/properties/${id}`, propertyData);
      return response.data;
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function deleteProperty(id: string) {
    loading.value = true;
    try {
      await axiosInstance.delete(`/properties/${id}`);
      properties.value = properties.value.filter(p => p._id !== id);
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function uploadImages(id: string, files: File[]) {
    loading.value = true;
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));

      const response = await axiosInstance.post(`/properties/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function deleteImage(propertyId: string, imageId: string) {
    loading.value = true;
    try {
      await axiosInstance.delete(`/properties/${propertyId}/images/${imageId}`);
      if (currentProperty.value) {
        currentProperty.value.images = currentProperty.value.images.filter(
          img => img.publicId !== imageId
        );
      }
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  return {
    properties,
    currentProperty,
    loading,
    pagination,
    fetchProperties,
    fetchPropertyById,
    createProperty,
    updateProperty,
    deleteProperty,
    uploadImages,
    deleteImage
  };
});