import { redisClient } from '../server.js';
import Booking from '../models/Booking.model.js';
import mongoose from 'mongoose';

export class AvailabilityService {
    // Bloquear fechas temporalmente durante el proceso de reserva
    static async lockDates(
        propertyId: string,
        checkIn: Date,
        checkOut: Date,
        sessionId: string
    ): Promise<boolean> {
        const lockKey = `lock:property:${propertyId}:${checkIn.toISOString()}:${checkOut.toISOString()}`;
        const ttl = 300; // 5 minutos de bloqueo (reducido de 10 minutos)

        try {
            // Usar set con NX y EX en una sola operación
            const acquired = await redisClient.set(lockKey, sessionId, {
                NX: true,
                EX: ttl
            });

            if (acquired) {
                console.log(`🔒 Fechas bloqueadas: ${lockKey}`);
                return true;
            }
            console.log(`⚠️ No se pudo bloquear: ${lockKey} (ya bloqueado)`);
            return false;
        } catch (error) {
            console.error('Error al bloquear fechas:', error);
            return false;
        }
    }

    // Liberar bloqueo de fechas
    static async unlockDates(
        propertyId: string,
        checkIn: Date,
        checkOut: Date,
        sessionId: string
    ): Promise<void> {
        const lockKey = `lock:property:${propertyId}:${checkIn.toISOString()}:${checkOut.toISOString()}`;

        try {
            // Verificar que el bloqueo sea de esta sesión antes de liberar
            const currentSession = await redisClient.get(lockKey);
            if (currentSession === sessionId) {
                await redisClient.del(lockKey);
                console.log(`🔓 Bloqueo liberado: ${lockKey}`);
            } else if (currentSession) {
                console.log(`⚠️ Intento de liberar bloqueo de otra sesión: ${lockKey}`);
            }
        } catch (error) {
            console.error('Error al liberar bloqueo:', error);
        }
    }

    // Limpiar todos los bloqueos de una propiedad (útil para debugging)
    static async clearAllLocks(propertyId: string): Promise<void> {
        try {
            const keys = await redisClient.keys(`lock:property:${propertyId}:*`);
            if (keys.length > 0) {
                await redisClient.del(keys);
                console.log(`🧹 Limpiados ${keys.length} bloqueos para propiedad ${propertyId}`);
            }
        } catch (error) {
            console.error('Error al limpiar bloqueos:', error);
        }
    }

    // Verificar disponibilidad de fechas
    static async checkAvailability(
        propertyId: string,
        checkIn: Date,
        checkOut: Date
    ): Promise<boolean> {
        try {
            // Normalizar a UTC para comparación
            const checkInUTC = new Date(Date.UTC(
                checkIn.getUTCFullYear(),
                checkIn.getUTCMonth(),
                checkIn.getUTCDate()
            ));

            const checkOutUTC = new Date(Date.UTC(
                checkOut.getUTCFullYear(),
                checkOut.getUTCMonth(),
                checkOut.getUTCDate()
            ));

            console.log(`🔍 Verificando disponibilidad UTC:`);
            console.log(`   Check-in: ${checkInUTC.toISOString()}`);
            console.log(`   Check-out: ${checkOutUTC.toISOString()}`);

            // Buscar conflictos usando fechas UTC normalizadas
            const conflictingBooking = await Booking.findOne({
                propertyId: new mongoose.Types.ObjectId(propertyId),
                status: { $in: ['confirmed', 'pending'] },
                $or: [
                    { checkIn: { $lt: checkOutUTC, $gte: checkInUTC } },
                    { checkOut: { $gt: checkInUTC, $lte: checkOutUTC } },
                    { $and: [{ checkIn: { $lte: checkInUTC } }, { checkOut: { $gte: checkOutUTC } }] }
                ]
            });

            if (conflictingBooking) {
                console.log(`   ❌ Conflicto con reserva existente`);
                return false;
            }

            console.log(`   ✅ Fechas disponibles`);
            return true;
        } catch (error) {
            console.error('Error al verificar disponibilidad:', error);
            return false;
        }
    }

    // Obtener fechas bloqueadas para una propiedad
    static async getBlockedDates(
        propertyId: string,
        startDate: Date,
        endDate: Date
    ): Promise<Date[]> {
        try {
            // Obtener reservas confirmadas
            const bookings = await Booking.find({
                propertyId: new mongoose.Types.ObjectId(propertyId),
                status: { $in: ['confirmed', 'pending'] },
                checkOut: { $gte: startDate },
                checkIn: { $lte: endDate }
            });

            const blockedDates: Date[] = [];

            // Generar array de fechas bloqueadas
            bookings.forEach(booking => {
                let currentDate = new Date(booking.checkIn);
                const end = new Date(booking.checkOut);

                while (currentDate < end) {
                    blockedDates.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            });

            // También considerar bloqueos de Redis (para mostrar fechas temporalmente bloqueadas)
            const redisKeys = await redisClient.keys(`lock:property:${propertyId}:*`);
            for (const key of redisKeys) {
                const match = key.match(/lock:property:[^:]+:([^:]+):([^:]+)/);
                if (match) {
                    const lockCheckIn = new Date(match[1]);
                    const lockCheckOut = new Date(match[2]);
                    let currentDate = new Date(lockCheckIn);
                    while (currentDate < lockCheckOut && currentDate <= endDate) {
                        if (currentDate >= startDate) {
                            blockedDates.push(new Date(currentDate));
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
            }

            return blockedDates;
        } catch (error) {
            console.error('Error al obtener fechas bloqueadas:', error);
            return [];
        }
    }

    // Cachear disponibilidad para búsquedas rápidas
    static async cacheAvailability(
        propertyId: string,
        date: Date,
        available: boolean
    ): Promise<void> {
        const cacheKey = `availability:${propertyId}:${date.toISOString().split('T')[0]}`;
        const ttl = 3600; // 1 hora

        try {
            await redisClient.setEx(cacheKey, ttl, available ? '1' : '0');
        } catch (error) {
            console.error('Error al cachear disponibilidad:', error);
        }
    }
}