import { Request, Response } from 'express';
import Property from '../models/Property.model.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { ImageService } from '../services/image.service.js';

// Obtener todas las propiedades (con filtros)
export const getProperties = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      minPrice,
      maxPrice,
      city,
      bedrooms,
      amenities,
      sort = '-createdAt'
    } = req.query;

    const query: any = { isActive: true };

    // Aplicar filtros
    if (type) query.type = type;
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (bedrooms) query.bedrooms = { $gte: Number(bedrooms) };
    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }
    if (amenities) {
      const amenitiesArray = (amenities as string).split(',');
      query.amenities = { $all: amenitiesArray };
    }

    // Paginación
    const skip = (Number(page) - 1) * Number(limit);
    
    const [properties, total] = await Promise.all([
      Property.find(query)
        .populate('hostId', 'name email avatar')
        .sort(sort as string)
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments(query)
    ]);

    res.json({
      properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    res.status(500).json({ error: 'Error al obtener propiedades' });
  }
};

// Obtener propiedad por ID
export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const property = await Property.findById(id)
      .populate('hostId', 'name email avatar phone');
    
    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }
    
    // Incrementar contador de vistas
    property.views += 1;
    await property.save();
    
    res.json(property);
  } catch (error) {
    console.error('Error al obtener propiedad:', error);
    res.status(500).json({ error: 'Error al obtener propiedad' });
  }
};

// Crear nueva propiedad (solo anfitriones)
export const createProperty = async (req: AuthRequest, res: Response) => {
  try {
    const propertyData = req.body;
    const hostId = req.user._id;
    
    // Validar que el usuario sea anfitrión
    if (req.user.role !== 'anfitrion' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Solo los anfitriones pueden crear propiedades' 
      });
    }
    
    const property = new Property({
      ...propertyData,
      hostId
    });
    
    await property.save();
    
    res.status(201).json({
      message: 'Propiedad creada exitosamente',
      property
    });
  } catch (error) {
    console.error('Error al crear propiedad:', error);
    res.status(500).json({ error: 'Error al crear propiedad' });
  }
};

// Actualizar propiedad
export const updateProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const property = await Property.findById(id);
    
    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }
    
    // Verificar permisos (solo el dueño o admin)
    if (property.hostId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'No tienes permiso para modificar esta propiedad' 
      });
    }
    
    // Actualizar campos permitidos
    const allowedUpdates = [
      'title', 'description', 'type', 'location', 'amenities',
      'pricePerNight', 'pricePerWeek', 'discountPercent', 'capacity',
      'bedrooms', 'bathrooms', 'area', 'rules', 'checkInTime', 'checkOutTime'
    ];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        (property as any)[field] = updates[field];
      }
    });
    
    await property.save();
    
    res.json({
      message: 'Propiedad actualizada exitosamente',
      property
    });
  } catch (error) {
    console.error('Error al actualizar propiedad:', error);
    res.status(500).json({ error: 'Error al actualizar propiedad' });
  }
};

// Eliminar propiedad (soft delete)
export const deleteProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const property = await Property.findById(id);
    
    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }
    
    // Verificar permisos
    if (property.hostId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'No tienes permiso para eliminar esta propiedad' 
      });
    }
    
    // Soft delete (marcar como inactiva)
    property.isActive = false;
    await property.save();
    
    res.json({ message: 'Propiedad eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar propiedad:', error);
    res.status(500).json({ error: 'Error al eliminar propiedad' });
  }
};

// Obtener propiedades del anfitrión actual
export const getMyProperties = async (req: AuthRequest, res: Response) => {
  try {
    const properties = await Property.find({ hostId: req.user._id })
      .sort('-createdAt');
    
    // Para cada propiedad, agregar estadísticas básicas
    // (esto se mejorará cuando implementemos reservas)
    const propertiesWithStats = properties.map(prop => ({
      ...prop.toObject(),
      totalBookings: 0, // Temporal
      totalEarnings: 0  // Temporal
    }));
    
    res.json(propertiesWithStats);
  } catch (error) {
    console.error('Error al obtener mis propiedades:', error);
    res.status(500).json({ error: 'Error al obtener propiedades' });
  }
};

// Subir imágenes para una propiedad
export const uploadPropertyImages = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No se enviaron imágenes' });
    }
    
    const property = await Property.findById(id);
    
    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }
    
    // Verificar permisos
    if (property.hostId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    // Procesar cada imagen
    const uploadedImages = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isMain = property.images.length === 0 && i === 0;
      
      const uploaded = await ImageService.uploadImage(
        file.buffer,
        file.originalname,
        isMain
      );
      
      uploadedImages.push({
        url: uploaded.url,
        publicId: uploaded.publicId,
        isMain
      });
    }
    
    property.images.push(...uploadedImages);
    await property.save();
    
    res.status(201).json({
      message: 'Imágenes subidas exitosamente',
      images: uploadedImages
    });
  } catch (error) {
    console.error('Error al subir imágenes:', error);
    res.status(500).json({ error: 'Error al subir imágenes' });
  }
};

// Eliminar imagen de propiedad
export const deletePropertyImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id, imageId } = req.params;
    
    const property = await Property.findById(id);
    
    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }
    
    // Verificar permisos
    if (property.hostId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const imageIndex = property.images.findIndex(img => img.publicId === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }
    
    // Eliminar de almacenamiento
    await ImageService.deleteImage(imageId);
    
    // Eliminar del array
    property.images.splice(imageIndex, 1);
    
    // Si eliminamos la imagen principal y hay otras, establecer la primera como principal
    if (property.images.length > 0 && !property.images.some(img => img.isMain)) {
      property.images[0].isMain = true;
    }
    
    await property.save();
    
    res.json({ message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({ error: 'Error al eliminar imagen' });
  }
};

// Obtener estadísticas de propiedades del anfitrión (reservas y ganancias por propiedad)
export const getMyPropertiesStats = async (req: AuthRequest, res: Response) => {
  try {
    // Obtener propiedades del anfitrión
    const properties = await Property.find({ hostId: req.user._id });
    const propertyIds = properties.map(p => p._id);
    
    if (propertyIds.length === 0) {
      return res.json([]);
    }
    
    // Obtener todas las reservas de las propiedades del anfitrión
    const bookings = await Booking.find({ 
      propertyId: { $in: propertyIds },
      status: { $in: ['confirmed', 'completed'] }
    });
    
    // Calcular estadísticas por propiedad
    const stats = properties.map(property => {
      const propertyBookings = bookings.filter(b => 
        b.propertyId.toString() === property._id.toString()
      );
      
      return {
        propertyId: property._id,
        propertyTitle: property.title,
        totalBookings: propertyBookings.length,
        totalEarnings: propertyBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
      };
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting property stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de propiedades' });
  }
};