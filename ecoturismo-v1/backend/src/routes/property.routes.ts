import express from 'express';
import multer from 'multer';
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  uploadPropertyImages,
  deletePropertyImage,
  getMyPropertiesStats
} from '../controllers/property.controller.js';
import { PlacesService } from '../services/places.service.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configurar multer para manejo de imágenes (en memoria)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes') as any, false);
    }
  }
});

// ============= RUTAS PÚBLICAS (No requieren autenticación) =============
router.get('/', getProperties);
router.get('/:id', getPropertyById);

// Ruta para obtener comercios cercanos (pública)
router.get('/:id/nearby-places', async (req, res) => {
  try {
    const { id } = req.params;
    const { radius = 1000 } = req.query;
    
    console.log(`📍 Buscando comercios cercanos para propiedad ${id} con radio ${radius}m`);
    
    // Importar el modelo Property dinámicamente para evitar problemas de circular dependency
    const Property = (await import('../models/Property.model.js')).default;
    
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }
    
    const [lon, lat] = property.location.coordinates;
    console.log(`📍 Coordenadas: ${lat}, ${lon}`);
    
    const places = await PlacesService.getNearbyPlaces(lat, lon, parseInt(radius));
    const address = await PlacesService.reverseGeocode(lat, lon);
    const recommendation = PlacesService.generateRecommendation(places);
    
    res.json({
      propertyId: id,
      location: { lat, lon, address },
      places: places.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        category: p.category,
        lat: p.lat,
        lon: p.lon,
        distance: p.distance
      })),
      recommendation,
      totalPlaces: places.length,
      searchRadius: radius
    });
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    res.status(500).json({ error: 'Error al obtener comercios cercanos' });
  }
});

// ============= RUTAS PROTEGIDAS (Requieren autenticación) =============
router.use(authenticate);

// Rutas para anfitriones
router.post('/', authorize('anfitrion', 'admin'), createProperty);
router.get('/my/properties', getMyProperties);
router.get('/my/properties/stats', authenticate, authorize('anfitrion', 'admin'), getMyPropertiesStats);
router.put('/:id', authorize('anfitrion', 'admin'), updateProperty);
router.delete('/:id', authorize('anfitrion', 'admin'), deleteProperty);
router.post(
  '/:id/images',
  upload.array('images', 10),
  authorize('anfitrion', 'admin'),
  uploadPropertyImages
);
router.delete('/:id/images/:imageId', authorize('anfitrion', 'admin'), deletePropertyImage);

export default router;