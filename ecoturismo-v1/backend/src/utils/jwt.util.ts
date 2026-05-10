import jwt from 'jsonwebtoken';
import { redisClient } from '../server.js';
import Token from '../models/Token.model.js';

export const generateTokens = async (userId: string) => {
  // Generar tokens
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' } // 15 minutos para access token
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' } // 7 días para refresh token
  );
  
  // Guardar refresh token en MongoDB
  const refreshTokenDoc = new Token({
    userId,
    token: refreshToken,
    type: 'refresh',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
  });
  await refreshTokenDoc.save();
  
  // Guardar access token en Redis para blacklist (opcional)
  await redisClient.setEx(
    `access_token:${accessToken}`,
    900, // 15 minutos en segundos
    userId
  );
  
  return { accessToken, refreshToken };
};

export const verifyRefreshToken = async (refreshToken: string) => {
  try {
    // Verificar firma
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    // Verificar en base de datos
    const tokenDoc = await Token.findOne({
      token: refreshToken,
      userId: decoded.userId,
      type: 'refresh',
      isRevoked: false
    });
    
    if (!tokenDoc) {
      throw new Error('Refresh token inválido o revocado');
    }
    
    // Verificar expiración
    if (tokenDoc.expiresAt < new Date()) {
      await tokenDoc.deleteOne();
      throw new Error('Refresh token expirado');
    }
    
    return decoded.userId;
  } catch (error) {
    throw new Error('Refresh token inválido');
  }
};

export const revokeTokens = async (userId: string, token?: string) => {
  // Revocar todos los refresh tokens
  await Token.updateMany(
    { userId, type: 'refresh' },
    { isRevoked: true }
  );
  
  // Si se proporciona un token específico, revocarlo en Redis
  if (token) {
    await redisClient.del(`access_token:${token}`);
  }
};