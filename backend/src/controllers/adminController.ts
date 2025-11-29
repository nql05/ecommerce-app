import { Request, Response } from "express";
import adminService from "../services/adminService";

export const listSellers = async (req: Request, res: Response) => {
  const users: any = await adminService.listSellers();

  // Get Seller only
  const sellers = users.filter((user: any) => {
    return user.Seller !== null;
  });

  res.json(sellers);
};

export const listBuyers = async (req: Request, res: Response) => {
  const users: any = await adminService.listBuyers();

  // Get Buyer only
  const buyers = users.filter((user: any) => {
    return user.Buyer !== null;
  });

  res.json(buyers);
};

export const readSeller = async (req: Request, res: Response) => {
  const { loginName } = req.params;
  const user = await adminService.readSeller(loginName);
  res.json(user);
};

export const readBuyer = async (req: Request, res: Response) => {
  const { loginName } = req.params;
  const user = await adminService.readBuyer(loginName);
  res.json(user);
};

// Preserve for future use
// export const editUser = async (req: Request, res: Response) => {
//   const { loginName } = req.params;
//   const user = await adminService.updateUser(loginName, req.body);
//   res.json(user);
// };

// export const stats = async (req: Request, res: Response) => {
//   const s = await adminService.getStats();
//   res.json(s);
// };

export default {
  listSellers,
  listBuyers,
  readSeller,
  readBuyer,
};
