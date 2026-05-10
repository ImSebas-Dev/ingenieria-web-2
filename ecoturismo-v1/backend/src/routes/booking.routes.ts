import express from 'express';
import {
  createBooking,
  confirmBooking,
  cancelBooking,
  getMyBookings,
  getHostBookings,
  completeBooking,
  checkAvailability,
  getBlockedDates
} from '../controllers/booking.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.get('/check-availability', checkAvailability);
router.get('/properties/:propertyId/blocked-dates', getBlockedDates);

// Rutas protegidas (requieren autenticación)
router.use(authenticate);

// Turista
router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);
router.put('/:id/confirm', confirmBooking);
router.put('/:id/cancel', cancelBooking);

// Anfitrión
router.get('/host-bookings', authorize('anfitrion', 'admin'), getHostBookings);
router.put('/:id/complete', authorize('anfitrion', 'admin'), completeBooking);

export default router;