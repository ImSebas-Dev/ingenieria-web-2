import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import User from '../models/User.model.js';
import Property from '../models/Property.model.js';
import Booking from '../models/Booking.model.js';
import Review from '../models/Review.model.js';

const router = express.Router();

// Middleware de autenticación y autorización para todas las rutas admin
router.use(authenticate);
router.use(authorize('admin'));

// ============ DASHBOARD STATS ============
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalProperties, totalBookings, activeProperties, pendingProperties, confirmedBookings, completedBookings] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Booking.countDocuments(),
      Property.countDocuments({ isActive: true }),
      Property.countDocuments({ isVerified: false }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'completed' })
    ]);

    // Calcular ingresos totales (reservas confirmadas y completadas)
    const revenueResult = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Usuarios recientes
    const recentUsers = await User.find().sort('-createdAt').limit(5).select('name email role createdAt');

    // Reservas recientes
    const recentBookings = await Booking.find()
      .populate('propertyId', 'title')
      .populate('turistaId', 'name')
      .sort('-createdAt')
      .limit(5);

    // Estadísticas mensuales (últimos 6 meses)
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyStats = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const bookings = await Booking.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      const revenue = await Booking.aggregate([
        { 
          $match: { 
            status: { $in: ['confirmed', 'completed'] },
            createdAt: { $gte: date, $lt: nextDate }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]);
      
      monthlyStats.push({
        month: months[date.getMonth()],
        bookings,
        revenue: revenue[0]?.total || 0
      });
    }

    res.json({
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue,
      activeProperties,
      pendingProperties,
      confirmedBookings,
      completedBookings,
      recentUsers,
      recentBookings,
      monthlyStats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ============ GESTIÓN DE USUARIOS ============
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    
    const [users, total] = await Promise.all([
      User.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(query)
    ]);
    
    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    res.json({ message: 'Rol actualizado', user });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
});

router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
    res.json({ message: 'Estado actualizado', user });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// ============ GESTIÓN DE PROPIEDADES ============
router.get('/properties', async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '', type = '', status = '', sort = '-createdAt' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }
    if (type) query.type = type;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (status === 'pending') query.isVerified = false;
    
    const [properties, total] = await Promise.all([
      Property.find(query)
        .populate('hostId', 'name email')
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
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Error al obtener propiedades' });
  }
});

router.put('/properties/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const property = await Property.findByIdAndUpdate(id, { isActive }, { new: true });
    res.json({ message: 'Estado actualizado', property });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

router.put('/properties/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    
    const property = await Property.findByIdAndUpdate(id, { isVerified }, { new: true });
    res.json({ message: 'Verificación actualizada', property });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar verificación' });
  }
});

// ============ GESTIÓN DE RESERVAS ============
router.get('/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', sort = '-createdAt' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const query: any = {};
    if (search) {
      query.$or = [
        { 'propertyId.title': { $regex: search, $options: 'i' } },
        { 'turistaId.name': { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('propertyId', 'title location hostId')
        .populate('turistaId', 'name email phone')
        .sort(sort as string)
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(query)
    ]);
    
    res.json({
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// ============ GESTIÓN DE RESEÑAS ============
router.get('/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', rating = '', sort = '-createdAt' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const query: any = {};
    if (search) {
      query.$or = [
        { 'propertyId.title': { $regex: search, $options: 'i' } },
        { 'userId.name': { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (rating) query.rating = Number(rating);
    
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('propertyId', 'title location hostId')
        .populate('userId', 'name email phone')
        .sort(sort as string)
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(query)
    ]);
    
    res.json({
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
});

router.put('/reviews/:id/moderate', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    let status = '';
    if (action === 'approve') status = 'active';
    if (action === 'remove') status = 'removed';
    if (action === 'flag') status = 'flagged';
    
    const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ message: 'Reseña moderada', review });
  } catch (error) {
    res.status(500).json({ error: 'Error al moderar reseña' });
  }
});

// ============ REPORTES ============
router.get('/reports/stats', async (req, res) => {
  try {
    // Top propiedades por reservas
    const topProperties = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: '$propertyId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'properties', localField: '_id', foreignField: '_id', as: 'property' } },
      { $unwind: '$property' },
      { $project: { _id: 1, title: '$property.title', totalBookings: '$count' } }
    ]);
    
    res.json({
      topProperties,
      topHosts: [],
      monthlyGrowth: []
    });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.json({ topProperties: [], topHosts: [], monthlyGrowth: [] });
  }
});

export default router;