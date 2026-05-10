import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  propertyId: mongoose.Types.ObjectId;
  turistaId: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
  paymentId?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  specialRequests?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  version: number; // Para control de concurrencia optimista
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  turistaId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true,
    validate: {
      validator: function(this: IBooking, value: Date) {
        return value > this.checkIn;
      },
      message: 'Check-out debe ser después de check-in'
    }
  },
  guests: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  specialRequests: {
    type: String,
    maxlength: 500
  },
  cancellationReason: {
    type: String
  },
  cancelledAt: Date,
  confirmedAt: Date,
  completedAt: Date,
  version: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
BookingSchema.index({ propertyId: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ turistaId: 1, status: 1 });
BookingSchema.index({ propertyId: 1, status: 1 });
BookingSchema.index({ checkIn: 1, checkOut: 1 });

// Verificar disponibilidad antes de guardar
BookingSchema.pre('save', async function(next) {
  const booking = this;
  
  // Verificar que no haya conflictos con otras reservas confirmadas
  if (booking.status === 'confirmed' || booking.status === 'pending') {
    const conflictingBooking = await mongoose.model('Booking').findOne({
      _id: { $ne: booking._id },
      propertyId: booking.propertyId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { checkIn: { $lt: booking.checkOut, $gte: booking.checkIn } },
        { checkOut: { $gt: booking.checkIn, $lte: booking.checkOut } },
        { $and: [{ checkIn: { $lte: booking.checkIn } }, { checkOut: { $gte: booking.checkOut } }] }
      ]
    });
    
    if (conflictingBooking) {
      next(new Error('Las fechas seleccionadas no están disponibles'));
    }
  }
  
  next();
});

export default mongoose.model<IBooking>('Booking', BookingSchema);