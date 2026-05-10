import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  propertyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  images?: string[];
  hostResponse?: {
    comment: string;
    createdAt: Date;
  };
  isVerified: boolean;
  isEdited: boolean;
  editedAt?: Date;
  helpful: number;
  helpfulBy: string[];  // Array de userIds que votaron como útil
  reported: boolean;
  status: 'active' | 'flagged' | 'removed';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 2000
  },
  images: [{
    type: String
  }],
  hostResponse: {
    comment: {
      type: String,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  helpful: {
    type: Number,
    default: 0
  },
  helpfulBy: {
    type: [String],
    default: []
  },
  reported: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'flagged', 'removed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
ReviewSchema.index({ propertyId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ status: 1 });

// Actualizar promedio de calificaciones en la propiedad
ReviewSchema.post('save', async function(doc) {
  const Property = mongoose.model('Property');
  const result = await mongoose.model('Review').aggregate([
    { $match: { propertyId: doc.propertyId, status: 'active' } },
    { $group: { _id: '$propertyId', avgRating: { $avg: '$rating' }, total: { $sum: 1 } } }
  ]);
  
  if (result.length > 0) {
    await Property.findByIdAndUpdate(doc.propertyId, {
      averageRating: result[0].avgRating,
      totalReviews: result[0].total
    });
  }
});

ReviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Property = mongoose.model('Property');
    const result = await mongoose.model('Review').aggregate([
      { $match: { propertyId: doc.propertyId, status: 'active' } },
      { $group: { _id: '$propertyId', avgRating: { $avg: '$rating' }, total: { $sum: 1 } } }
    ]);
    
    if (result.length > 0) {
      await Property.findByIdAndUpdate(doc.propertyId, {
        averageRating: result[0].avgRating,
        totalReviews: result[0].total
      });
    } else {
      await Property.findByIdAndUpdate(doc.propertyId, {
        averageRating: 0,
        totalReviews: 0
      });
    }
  }
});

export default mongoose.model<IReview>('Review', ReviewSchema);