import { Request, Response } from 'express';
import adminService from '../services/adminService';

export const listUsers = async (req: Request, res: Response) => {
  const users = await adminService.listUsers();
  res.json(users);
};

export const editUser = async (req: Request, res: Response) => {
  const { loginName } = req.params;
  const user = await adminService.updateUser(loginName, req.body);
  res.json(user);
};

export const stats = async (req: Request, res: Response) => {
  const s = await adminService.getStats();
  res.json(s);
};

export default { listUsers, editUser, stats };
