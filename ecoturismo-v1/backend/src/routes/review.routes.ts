import express from 'express';
import {
  createReview,
  getPropertyReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  respondToReview,
  markHelpful,
  reportReview,
  getHostReviewStats
} from '../controllers/review.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.get('/property/:propertyId', getPropertyReviews);

// Rutas protegidas
router.use(authenticate);

// Usuario
router.post('/', createReview);
router.get('/my-reviews', getMyReviews);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/helpful', markHelpful);
router.post('/:id/report', reportReview);

// Anfitrión
router.post('/:id/respond', authenticate, authorize('anfitrion', 'admin'), respondToReview);
router.get('/host/stats', authenticate, authorize('anfitrion', 'admin'), getHostReviewStats);

export default router;