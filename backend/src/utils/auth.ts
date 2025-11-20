import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (payload: object) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'secret');
};
