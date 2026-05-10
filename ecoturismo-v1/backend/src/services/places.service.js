import axios from 'axios';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

// Lista ampliada de tipos de comercios
const COMMERCE_TYPES = [
  'supermarket', 'restaurant', 'cafe', 'fast_food', 'pub', 'bar',
  'shop', 'mall', 'pharmacy', 'bank', 'atm', 'hotel',
  'convenience', 'grocery', 'food_court', 'ice_cream', 'bakery',
  'butcher', 'deli', 'greengrocer', 'marketplace', 'department_store',
  'clothes', 'electronics', 'furniture', 'hardware', 'bookstore'
];

export const PlacesService = {
  
  async getNearbyPlaces(lat, lon, radius = 1000) {
    try {
      const commerceQuery = `
        [out:json];
        (
          ${COMMERCE_TYPES.map(type => `node["shop"="${type}"](around:${radius},${lat},${lon});`).join('\n')}
          ${COMMERCE_TYPES.map(type => `node["amenity"="${type}"](around:${radius},${lat},${lon});`).join('\n')}
          way["shop"](around:${radius},${lat},${lon});
          way["amenity"](around:${radius},${lat},${lon});
        );
        out body;
        >;
        out skel qt;
      `;

      const response = await axios.get(OVERPASS_API_URL, {
        params: { data: commerceQuery },
        timeout: 15000,
        headers: {
          'User-Agent': 'EcoTurismo-Experiencial/1.0'
        }
      });
      
      const places = [];
      const seenNodes = new Set();
      
      if (response.data && response.data.elements) {
        for (const element of response.data.elements) {
          if (element.type === 'node' && !seenNodes.has(element.id)) {
            seenNodes.add(element.id);
            
            let placeType = element.tags?.shop || element.tags?.amenity || 'shop';
            let category = this.getPlaceCategory(placeType);
            
            places.push({
              id: element.id,
              name: element.tags?.name || this.getGenericName(placeType),
              type: placeType,
              category: category,
              lat: element.lat,
              lon: element.lon,
              distance: this.calculateDistance(lat, lon, element.lat, element.lon)
            });
          }
        }
      }
      
      // Si no hay resultados y el radio es menor a 3000m, intentar con radio más grande
      if (places.length === 0 && radius < 3000) {
        console.log(`No se encontraron comercios en ${radius}m, intentando con radio mayor...`);
        return this.getNearbyPlaces(lat, lon, Math.min(radius + 1000, 3000));
      }
      
      return places
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20);
        
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      return [];
    }
  },
  
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return Math.round(R * c);
  },
  
  getGenericName(type) {
    const names = {
      'supermarket': 'Supermercado',
      'restaurant': 'Restaurante',
      'cafe': 'Cafetería',
      'fast_food': 'Comida rápida',
      'pub': 'Pub',
      'bar': 'Bar',
      'pharmacy': 'Farmacia',
      'bank': 'Banco',
      'atm': 'Cajero',
      'hotel': 'Hotel',
      'convenience': 'Tienda de conveniencia',
      'grocery': 'Tienda de abarrotes',
      'bakery': 'Panadería',
      'butcher': 'Carnicería',
      'deli': 'Delicatessen',
      'greengrocer': 'Verdulería',
      'marketplace': 'Mercado',
      'department_store': 'Tienda por departamentos',
      'clothes': 'Tienda de ropa',
      'electronics': 'Electrónicos',
      'bookstore': 'Librería'
    };
    return names[type] || 'Comercio local';
  },
  
  getPlaceCategory(type) {
    const restaurantTypes = ['restaurant', 'cafe', 'fast_food', 'pub', 'bar', 'ice_cream', 'food_court'];
    const shoppingTypes = ['supermarket', 'shop', 'convenience', 'grocery', 'bakery', 'butcher', 'deli', 'greengrocer', 'marketplace', 'department_store', 'clothes', 'electronics', 'bookstore', 'furniture', 'hardware'];
    const serviceTypes = ['pharmacy', 'bank', 'atm', 'hotel'];
    
    if (restaurantTypes.includes(type)) return 'restaurant';
    if (shoppingTypes.includes(type)) return 'shopping';
    if (serviceTypes.includes(type)) return 'service';
    return 'other';
  },
  
  async reverseGeocode(lat, lon) {
    try {
      const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
        params: {
          lat: lat,
          lon: lon,
          format: 'json',
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'EcoTurismo-Experiencial/1.0'
        }
      });
      
      const data = response.data;
      return {
        displayName: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        state: data.address?.state,
        country: data.address?.country,
        postcode: data.address?.postcode
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  },
  
  generateRecommendation(places) {
    const density = places.length;
    
    if (density >= 20) {
      return {
        level: 'high',
        message: '🌟 Zona de alto comercio - ¡Todo lo que necesitas está a tu alcance! Supermercados, restaurantes y servicios muy cerca.',
        icon: '🏙️'
      };
    } else if (density >= 10) {
      return {
        level: 'medium',
        message: '👍 Buena zona comercial - Varias opciones de restaurantes y tiendas a poca distancia. ¡Ubicación práctica y conveniente!',
        icon: '🛒'
      };
    } else if (density >= 3) {
      return {
        level: 'low',
        message: '📍 Zona tranquila con comercios básicos - Opciones cercanas para necesidades esenciales. Perfecto para descansar.',
        icon: '🏡'
      };
    } else {
      return {
        level: 'very_low',
        message: '🌿 Zona residencial tranquila - Ideal para conectar con la naturaleza. Recomendamos planificar compras con anticipación.',
        icon: '🌳'
      };
    }
  }
};

export default PlacesService;