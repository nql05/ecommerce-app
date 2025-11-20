import { Request, Response } from 'express';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import userService from '../services/userService';

export const register = async (req: Request, res: Response) => {
  try {
    const { loginName, password, userName, role } = req.body;
    if (!loginName || !password || !userName) return res.status(400).json({ error: 'Missing fields' });
    const hashedPassword = await hashPassword(password);
    const user = await userService.createUser({ loginName, password: hashedPassword, userName, role });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Register failed', details: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { loginName, password } = req.body;
    if (!loginName || !password) return res.status(400).json({ error: 'Missing credentials' });
    const user = await userService.findByLoginName(loginName);
    if (!user || !(await comparePassword(password, user.Password))) return res.status(400).json({ error: 'Invalid credentials' });
    const role = user.Buyer ? 'buyer' : user.Seller ? 'seller' : 'admin';
    const token = generateToken({ loginName: user.LoginName, role });
    res.json({ token, role });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: (err as Error).message });
  }
};

export default { register, login };
