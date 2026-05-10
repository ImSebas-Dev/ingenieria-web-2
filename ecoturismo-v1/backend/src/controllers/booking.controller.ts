import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.model.js';
import Property from '../models/Property.model.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { AvailabilityService } from '../services/availability.service.js';
import { v4 as uuidv4 } from 'uuid';

// Crear nueva reserva
export const createBooking = async (req: AuthRequest, res: Response) => {
  const sessionId = uuidv4();
  let locked = false;
  
  try {
    const { propertyId, checkIn, checkOut, guests, specialRequests } = req.body;
    const turistaId = req.user._id;
    
    // Validar fechas
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    console.log('📅 Creando reserva:', {
      propertyId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests
    });
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ error: 'Check-in debe ser antes de check-out' });
    }
    
    if (checkInDate < new Date()) {
      return res.status(400).json({ error: 'No se puede reservar en fechas pasadas' });
    }
    
    // Verificar disponibilidad
    const isAvailable = await AvailabilityService.checkAvailability(
      propertyId,
      checkInDate,
      checkOutDate
    );
    
    if (!isAvailable) {
      return res.status(409).json({ error: 'Las fechas seleccionadas no están disponibles' });
    }
    
    // Intentar bloquear las fechas
    locked = await AvailabilityService.lockDates(
      propertyId,
      checkInDate,
      checkOutDate,
      sessionId
    );
    
    if (!locked) {
      return res.status(409).json({ error: 'Otro usuario está reservando estas fechas. Intenta de nuevo.' });
    }
    
    // Obtener propiedad para calcular precio
    const property = await Property.findById(propertyId);
    
    if (!property) {
      await AvailabilityService.unlockDates(propertyId, checkInDate, checkOutDate, sessionId);
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }
    
    // Calcular precio total
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    let totalPrice = property.pricePerNight * nights;
    
    // Aplicar descuento semanal si aplica
    if (nights >= 7 && property.pricePerWeek) {
      totalPrice = property.pricePerWeek * Math.floor(nights / 7) + (property.pricePerNight * (nights % 7));
    }
    
    // Aplicar descuento porcentual
    if (property.discountPercent && property.discountPercent > 0) {
      totalPrice = totalPrice * (1 - property.discountPercent / 100);
    }
    
    // Crear reserva
    const booking = new Booking({
      propertyId,
      turistaId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      totalPrice: Math.round(totalPrice),
      specialRequests,
      status: 'pending',
      paymentStatus: 'pending',
      version: 0
    });
    
    await booking.save();
    
    // Liberar el bloqueo después de guardar exitosamente
    await AvailabilityService.unlockDates(propertyId, checkInDate, checkOutDate, sessionId);
    
    // Poblar datos para la respuesta
    const populatedBooking = await Booking.findById(booking._id)
      .populate('propertyId', 'title images location')
      .populate('turistaId', 'name email');
    
    console.log('✅ Reserva creada:', booking._id);
    
    res.status(201).json({
      message: 'Reserva creada exitosamente',
      booking: populatedBooking
    });
  } catch (error) {
    // Si hay error, liberar el bloqueo si estaba activo
    if (locked && req.body) {
      await AvailabilityService.unlockDates(req.body.propertyId, new Date(req.body.checkIn), new Date(req.body.checkOut), sessionId);
    }
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: 'Error al crear la reserva' });
  }
};

// Confirmar reserva (después del pago)
export const confirmBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;
    
    console.log('💰 Confirmando reserva:', id);
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    
    // Verificar permisos (solo el turista o admin)
    if (booking.turistaId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    // Solo confirmar si está pendiente
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'La reserva ya fue procesada' });
    }
    
    // Confirmar reserva (sin verificar disponibilidad nuevamente)
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.paymentId = paymentId;
    booking.confirmedAt = new Date();
    
    await booking.save();
    
    console.log('✅ Reserva confirmada:', booking._id);
    
    res.json({
      message: 'Reserva confirmada exitosamente',
      booking
    });
  } catch (error) {
    console.error('Error al confirmar reserva:', error);
    res.status(500).json({ error: 'Error al confirmar la reserva' });
  }
};

// Cancelar reserva
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    
    // Verificar permisos
    const isTurista = booking.turistaId.toString() === req.user._id.toString();
    const property = await Property.findById(booking.propertyId);
    const isAnfitrion = property && property.hostId.toString() === req.user._id.toString();
    
    if (!isTurista && !isAnfitrion && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    // Verificar si se puede cancelar (menos de 24 horas antes del check-in)
    const hoursBeforeCheckIn = (booking.checkIn.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    
    if (hoursBeforeCheckIn < 24 && booking.status === 'confirmed') {
      return res.status(400).json({ error: 'No se puede cancelar con menos de 24 horas de anticipación' });
    }
    
    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelado por el usuario';
    booking.cancelledAt = new Date();
    
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    }
    
    await booking.save();
    
    res.json({
      message: 'Reserva cancelada exitosamente',
      booking
    });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error al cancelar la reserva' });
  }
};

// Obtener reservas del usuario (turista)
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ turistaId: req.user._id })
      .populate('propertyId', 'title images location pricePerNight')
      .sort('-createdAt');
    
    res.json(bookings);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
};

// Obtener reservas de las propiedades del anfitrión
export const getHostBookings = async (req: AuthRequest, res: Response) => {
  try {
    // Obtener propiedades del anfitrión
    const properties = await Property.find({ hostId: req.user._id });
    const propertyIds = properties.map(p => p._id);
    
    const bookings = await Booking.find({ propertyId: { $in: propertyIds } })
      .populate('propertyId', 'title images location')
      .populate('turistaId', 'name email avatar')
      .sort('-createdAt');
    
    res.json(bookings);
  } catch (error) {
    console.error('Error al obtener reservas del anfitrión:', error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
};

// Completar reserva (después de la estadía)
export const completeBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    
    // Verificar permisos (solo anfitrión o admin)
    const property = await Property.findById(booking.propertyId);
    const isAnfitrion = property && property.hostId.toString() === req.user._id.toString();
    
    if (!isAnfitrion && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Solo se pueden completar reservas confirmadas' });
    }
    
    if (booking.checkOut > new Date()) {
      return res.status(400).json({ error: 'La estadía aún no ha terminado' });
    }
    
    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();
    
    res.json({
      message: 'Reserva completada exitosamente',
      booking
    });
  } catch (error) {
    console.error('Error al completar reserva:', error);
    res.status(500).json({ error: 'Error al completar la reserva' });
  }
};

// Verificar disponibilidad de fechas (endpoint público)
export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { propertyId, checkIn, checkOut } = req.query;
    
    if (!propertyId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }
    
    const isAvailable = await AvailabilityService.checkAvailability(
      propertyId as string,
      new Date(checkIn as string),
      new Date(checkOut as string)
    );
    
    res.json({ available: isAvailable });
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    res.status(500).json({ error: 'Error al verificar disponibilidad' });
  }
};

// Obtener fechas bloqueadas (para calendario)
export const getBlockedDates = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { start, end } = req.query;
    
    const startDate = start ? new Date(start as string) : new Date();
    const endDate = end ? new Date(end as string) : new Date();
    endDate.setMonth(endDate.getMonth() + 3); // 3 meses hacia adelante
    
    const blockedDates = await AvailabilityService.getBlockedDates(
      propertyId,
      startDate,
      endDate
    );
    
    res.json({ blockedDates });
  } catch (error) {
    console.error('Error al obtener fechas bloqueadas:', error);
    res.status(500).json({ error: 'Error al obtener fechas bloqueadas' });
  }
};