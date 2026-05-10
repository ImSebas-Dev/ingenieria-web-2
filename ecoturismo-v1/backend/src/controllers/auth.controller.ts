import { Request, Response } from 'express';
import User from '../models/User.model.js';
import { generateTokens, verifyRefreshToken, revokeTokens } from '../utils/jwt.util.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, phone } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    
    // Crear nuevo usuario
    const user = new User({
      email,
      password,
      name,
      role: role || 'turista',
      phone
    });
    
    await user.save();
    
    // Generar tokens
    const { accessToken, refreshToken } = await generateTokens(user._id.toString());
    
    // Retornar usuario (sin password) y tokens
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userResponse,
      tokens: {
        access: accessToken,
        refresh: refreshToken
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Verificar si está activo
    if (!user.isActive) {
      return res.status(401).json({ error: 'Cuenta desactivada' });
    }
    
    // Verificar password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();
    
    // Generar tokens
    const { accessToken, refreshToken } = await generateTokens(user._id.toString());
    
    // Retornar usuario (sin password) y tokens
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      message: 'Login exitoso',
      user: userResponse,
      tokens: {
        access: accessToken,
        refresh: refreshToken
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }
    
    const userId = await verifyRefreshToken(refreshToken);
    
    // Revocar el refresh token usado
    await revokeTokens(userId, refreshToken);
    
    // Generar nuevos tokens
    const tokens = await generateTokens(userId);
    
    res.json({
      message: 'Tokens renovados',
      tokens
    });
  } catch (error) {
    console.error('Error en refresh:', error);
    res.status(401).json({ error: 'Refresh token inválido' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const token = req.token;
    
    // Revocar todos los tokens del usuario
    await revokeTokens(userId, token);
    
    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ user: userResponse });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { name, phone, avatar } = req.body;
    
    const updates = { name, phone, avatar };
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
    
    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({
      message: 'Perfil actualizado',
      user
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }
    
    user.password = newPassword;
    await user.save();
    
    // Revocar todos los tokens excepto el actual
    await revokeTokens(userId, req.token);
    
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};