import express from 'express';
import mongoose from 'mongoose';
import redis from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import propertyRoutes from './routes/property.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import reviewRoutes from './routes/review.routes.js';
import adminRoutes from './routes/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración CORS mejorada
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5000', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Knowledge-Request-Id']
};

// Middleware global
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Permitir imágenes cross-origin
}));
app.use(express.json());

// Servir archivos estáticos (IMÁGENES) con headers correctos
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

console.log('📁 Sirviendo archivos estáticos desde:', path.join(__dirname, '../uploads'));

// Verificar que el directorio existe
import fs from 'fs';
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('📁 Directorio uploads creado');
} else {
  console.log('📁 Directorio uploads ya existe');
}

// Rate limiting (evita ataques de fuerza bruta)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 peticiones por IP
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos'
});
app.use('/api', limiter);

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// Conexión a Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});
redisClient.connect()
  .then(() => console.log('✅ Redis conectado'))
  .catch(err => console.error('❌ Error Redis:', err));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API EcoTurismo funcionando 🚀' });
});

// Importar rutas
import authRoutes from './routes/auth.routes.js';

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    services: {
      mongodb: mongoose.connection.readyState === 1,
      redis: redisClient.isReady
    }
  });
});

app.get('/api/debug/images', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(__dirname, '../uploads/properties');
  
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    res.json({
      uploadsPath: uploadsDir,
      files: files,
      count: files.length
    });
  } else {
    res.json({
      error: 'Directorio no existe',
      uploadsPath: uploadsDir
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

export { redisClient };