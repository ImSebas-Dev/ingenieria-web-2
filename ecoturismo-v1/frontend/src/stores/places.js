// frontend/src/stores/places.js
import { defineStore } from 'pinia';
import axios from 'axios';

export const usePlacesStore = defineStore('places', {
  state: () => ({
    nearbyPlaces: [],
    recommendation: null,
    isLoading: false,
    error: null
  }),
  
  actions: {
    async fetchNearbyPlaces(propertyId, radius = 1000) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const response = await axios.get(`/api/properties/${propertyId}/nearby-places`, {
          params: { radius }
        });
        
        this.nearbyPlaces = response.data.places || [];
        this.recommendation = response.data.recommendation || null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Error al cargar comercios cercanos';
        console.error('Error:', this.error);
        return null;
      } finally {
        this.isLoading = false;
      }
    },
    
    clearPlaces() {
      this.nearbyPlaces = [];
      this.recommendation = null;
      this.error = null;
    }
  }
});