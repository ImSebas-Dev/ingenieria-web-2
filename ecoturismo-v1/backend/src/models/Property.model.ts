import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  description: string;
  type: 'casa' | 'cabaña' | 'finca' | 'glamping' | 'hotel_rural' | 'eco_lodge';
  hostId: mongoose.Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
    city: string;
    department: string;
    country: string;
  };
  amenities: string[];
  images: {
    url: string;
    publicId: string;
    isMain: boolean;
  }[];
  pricePerNight: number;
  pricePerWeek?: number;
  discountPercent?: number;
  capacity: {
    adults: number;
    children: number;
    extraBeds: number;
  };
  bedrooms: number;
  bathrooms: number;
  area: number; // en metros cuadrados
  rules: string[];
  checkInTime: string;
  checkOutTime: string;
  isActive: boolean;
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['casa', 'cabaña', 'finca', 'glamping', 'hotel_rural', 'eco_lodge'],
    required: true
  },
  hostId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    department: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'Colombia'
    }
  },
  amenities: [{
    type: String,
    enum: [
      'wifi', 'parking', 'piscina', 'cocina', 'aire_acondicionado',
      'calefaccion', 'tv', 'jacuzzi', 'barbacoa', 'mascotas_permitidas',
      'vista_montana', 'vista_rio', 'chimenea', 'hamaca', 'senderismo',
      'bicicletas', 'kayak', 'desayuno_incluido', 'restaurante'
    ]
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  pricePerNight: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerWeek: {
    type: Number,
    min: 0
  },
  discountPercent: {
    type: Number,
    min: 0,
    max: 100
  },
  capacity: {
    adults: {
      type: Number,
      required: true,
      min: 1,
      default: 2
    },
    children: {
      type: Number,
      default: 0
    },
    extraBeds: {
      type: Number,
      default: 0
    }
  },
  bedrooms: {
    type: Number,
    required: true,
    min: 1
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 1
  },
  area: {
    type: Number,
    required: true,
    min: 10
  },
  rules: [{
    type: String,
    enum: [
      'no_fumar', 'no_mascotas', 'no_fiestas', 'checkout_limpieza',
      'horario_silencio', 'cuidar_agua', 'reciclar'
    ]
  }],
  checkInTime: {
    type: String,
    default: '15:00'
  },
  checkOutTime: {
    type: String,
    default: '11:00'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
PropertySchema.index({ title: 'text', description: 'text' });
PropertySchema.index({ 'location.coordinates': '2dsphere' });
PropertySchema.index({ pricePerNight: 1 });
PropertySchema.index({ type: 1 });
PropertySchema.index({ averageRating: -1 });

export default mongoose.model<IProperty>('Property', PropertySchema);