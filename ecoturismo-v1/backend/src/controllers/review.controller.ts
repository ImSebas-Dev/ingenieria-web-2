import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.model.js';
import Booking from '../models/Booking.model.js';
import Property from '../models/Property.model.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

// Crear nueva reseña (solo después de reserva completada)
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, bookingId, rating, comment, images } = req.body;
    const userId = req.user._id;

    console.log('⭐ Creando reseña:', { propertyId, bookingId, rating, userId: userId.toString() });

    // Verificar que la reserva existe y está completada
    const booking = await Booking.findOne({
      _id: bookingId,
      turistaId: userId,
      propertyId: propertyId,
      status: 'completed'
    });

    if (!booking) {
      return res.status(403).json({ 
        error: 'Solo puedes reseñar propiedades que hayas visitado y completado tu estadía' 
      });
    }

    // Verificar que no haya una reseña previa para esta reserva
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ error: 'Ya has reseñado esta propiedad' });
    }

    // Validar comentario
    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({ error: 'La reseña debe tener al menos 10 caracteres' });
    }

    const review = new Review({
      propertyId,
      userId,
      bookingId,
      rating,
      comment: comment.trim(),
      images: images || [],
      isVerified: true,
      status: 'active',
      helpful: 0,
      helpfulBy: []
    });

    await review.save();

    // Poblar datos para la respuesta
    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'name avatar')
      .populate('propertyId', 'title');

    console.log('✅ Reseña creada:', review._id);

    res.status(201).json({
      message: 'Reseña publicada exitosamente',
      review: populatedReview
    });
  } catch (error) {
    console.error('Error al crear reseña:', error);
    res.status(500).json({ error: 'Error al crear la reseña' });
  }
};

// Obtener reseñas de una propiedad
export const getPropertyReviews = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ propertyId, status: 'active' })
        .populate('userId', 'name avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments({ propertyId, status: 'active' })
    ]);

    // Obtener estadísticas
    const stats = await Review.aggregate([
      { $match: { propertyId: new mongoose.Types.ObjectId(propertyId as string), status: 'active' } },
      { $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      } }
    ]);

    // Calcular distribución de calificaciones
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats[0]?.ratingDistribution) {
      stats[0].ratingDistribution.forEach((rating: number) => {
        distribution[rating as keyof typeof distribution]++;
      });
    }

    res.json({
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      stats: {
        averageRating: stats[0]?.averageRating || 0,
        totalReviews: total,
        distribution
      }
    });
  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
};

// Obtener mis reseñas (usuario actual)
export const getMyReviews = async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await Review.find({ userId: req.user._id, status: 'active' })
      .populate('propertyId', 'title images location')
      .sort('-createdAt');

    res.json(reviews);
  } catch (error) {
    console.error('Error al obtener mis reseñas:', error);
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
};

// Editar reseña (solo el autor)
export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment, images } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    // Verificar que sea el autor
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Verificar que no haya pasado más de 30 días
    const daysSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 30) {
      return res.status(400).json({ error: 'Solo puedes editar reseñas de los últimos 30 días' });
    }

    if (rating) review.rating = rating;
    if (comment) review.comment = comment.trim();
    if (images) review.images = images;
    review.isEdited = true;
    review.editedAt = new Date();

    await review.save();

    console.log('✏️ Reseña editada:', review._id);

    res.json({
      message: 'Reseña actualizada exitosamente',
      review
    });
  } catch (error) {
    console.error('Error al actualizar reseña:', error);
    res.status(500).json({ error: 'Error al actualizar reseña' });
  }
};

// Eliminar reseña (soft delete)
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    // Verificar permisos (autor o admin)
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    review.status = 'removed';
    await review.save();

    console.log('🗑️ Reseña eliminada:', review._id);

    res.json({ message: 'Reseña eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar reseña:', error);
    res.status(500).json({ error: 'Error al eliminar reseña' });
  }
};

// Responder a reseña (solo anfitrión) - CORREGIDO
export const respondToReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    console.log(`💬 Respondiendo a reseña ${id}`);

    // Validar que la respuesta no esté vacía
    if (!response || response.trim().length === 0) {
      return res.status(400).json({ error: 'La respuesta no puede estar vacía' });
    }

    if (response.trim().length > 1000) {
      return res.status(400).json({ error: 'La respuesta no puede exceder los 1000 caracteres' });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    // Verificar que el usuario sea el anfitrión de la propiedad
    const property = await Property.findById(review.propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    if (property.hostId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo el anfitrión puede responder' });
    }

    // Verificar si ya hay una respuesta COMPLETA (con comentario)
    if (review.hostResponse && review.hostResponse.comment) {
      return res.status(400).json({ error: 'Ya has respondido a esta reseña' });
    }

    // Guardar respuesta (asegurando que el comentario no esté vacío)
    review.hostResponse = {
      comment: response.trim(),
      createdAt: new Date()
    };

    await review.save();

    console.log(`✅ Respuesta publicada para reseña ${id}: "${response.trim().substring(0, 50)}..."`);

    // Devolver la reseña actualizada
    const updatedReview = await Review.findById(id)
      .populate('userId', 'name avatar');

    res.json({
      message: 'Respuesta publicada exitosamente',
      review: updatedReview
    });
  } catch (error) {
    console.error('Error al responder reseña:', error);
    res.status(500).json({ error: 'Error al responder reseña' });
  }
};

// Marcar reseña como útil (con toggle - como like/Unlike)
export const markHelpful = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    // Inicializar helpfulBy si no existe
    if (!review.helpfulBy) {
      review.helpfulBy = [];
    }

    // Verificar si el usuario ya votó
    const hasVoted = review.helpfulBy.includes(userId);

    if (hasVoted) {
      // Si ya votó, quitamos el voto (unlike)
      review.helpfulBy = review.helpfulBy.filter(id => id !== userId);
      review.helpful = Math.max(0, review.helpful - 1);
      console.log(`👎 Usuario ${userId} quitó voto útil de reseña ${id}`);
    } else {
      // Si no ha votado, agregamos el voto
      review.helpfulBy.push(userId);
      review.helpful += 1;
      console.log(`👍 Usuario ${userId} marcó como útil reseña ${id}`);
    }

    await review.save();

    res.json({ 
      message: hasVoted ? 'Voto eliminado' : 'Gracias por tu feedback', 
      helpful: review.helpful,
      hasVoted: !hasVoted
    });
  } catch (error) {
    console.error('Error al marcar útil:', error);
    res.status(500).json({ error: 'Error al marcar reseña como útil' });
  }
};

// Verificar si el usuario ya votó una reseña
export const getHelpfulStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    const hasVoted = review.helpfulBy?.includes(userId) || false;

    res.json({ hasVoted });
  } catch (error) {
    console.error('Error al obtener estado:', error);
    res.status(500).json({ error: 'Error al obtener estado' });
  }
};

// Reportar reseña (para moderación)
export const reportReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, autoFlag = true } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    // No permitir reportar la propia reseña
    if (review.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'No puedes reportar tu propia reseña' });
    }

    review.reported = true;
    if (autoFlag) {
      review.status = 'flagged';
    }
    
    // Guardar razón del reporte (opcional, podrías agregar un campo)
    await review.save();

    console.log(`⚠️ Reseña reportada: ${review._id} por usuario ${req.user._id}, razón: ${reason || 'No especificada'}`);

    res.json({ 
      message: 'Reseña reportada, será revisada por moderación',
      reviewId: review._id
    });
  } catch (error) {
    console.error('Error al reportar reseña:', error);
    res.status(500).json({ error: 'Error al reportar reseña' });
  }
};

// Obtener estadísticas de reseñas para anfitrión
export const getHostReviewStats = async (req: AuthRequest, res: Response) => {
  try {
    // Obtener propiedades del anfitrión
    const properties = await Property.find({ hostId: req.user._id });
    const propertyIds = properties.map(p => p._id);

    if (propertyIds.length === 0) {
      return res.json({
        stats: {
          averageRating: 0,
          totalReviews: 0,
          fiveStars: 0,
          fourStars: 0,
          threeStars: 0,
          twoStars: 0,
          oneStar: 0
        }
      });
    }

    const stats = await Review.aggregate([
      { $match: { propertyId: { $in: propertyIds }, status: 'active' } },
      { $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
      } }
    ]);

    res.json({
      stats: stats[0] || {
        averageRating: 0,
        totalReviews: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Obtener reseñas pendientes de respuesta (para anfitrión)
export const getPendingResponses = async (req: AuthRequest, res: Response) => {
  try {
    // Obtener propiedades del anfitrión
    const properties = await Property.find({ hostId: req.user._id });
    const propertyIds = properties.map(p => p._id);

    const pendingReviews = await Review.find({
      propertyId: { $in: propertyIds },
      status: 'active',
      $or: [
        { hostResponse: { $exists: false } },
        { 'hostResponse.comment': { $exists: false } },
        { 'hostResponse.comment': null },
        { 'hostResponse.comment': '' }
      ]
    }).populate('userId', 'name avatar');

    res.json(pendingReviews);
  } catch (error) {
    console.error('Error al obtener reseñas pendientes:', error);
    res.status(500).json({ error: 'Error al obtener reseñas pendientes' });
  }
};