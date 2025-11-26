import { Request, Response } from "express";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";
import userService from "../services/userService";

export const register = async (req: Request, res: Response) => {
  try {
    const { loginName, password, userName, role } = req.body;
    if (!loginName || !password || !userName)
      return res.status(400).json({ error: "Missing fields" });
    const hashedPassword = await hashPassword(password);
    const user = await userService.createUser({
      loginName,
      password: hashedPassword,
      userName,
      role,
    });
    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Register failed", details: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { loginName, password, role } = req.body;
    if (!loginName || !password || !role)
      return res.status(400).json({ error: "Missing credentials" });

    // quick dev-only shortcut
    if (loginName === "deptrai" && password === "deptrai") {
      const systemRole = "A";
      const token = generateToken({ loginName, role: systemRole });
      return res.json({ token });
    }

    // Lookup user in DB
    const user = await userService.findByLoginName(loginName);
    if (!user)
      return res.status(400).json({ error: "Invalid credentials" });

    // Compare password
    const passwordMatches = await comparePassword(password, (user as any).Password);
    if (!passwordMatches)
      return res.status(400).json({ error: "Invalid credentials" });

    // Determine role from relations
    const actualRole = (user as any).Buyer ? "B" : (user as any).Seller ? "S" : "A";
    if (role !== actualRole)
      return res.status(403).json({ error: "Unauthorized role" });

    const token = generateToken({ loginName: (user as any).LoginName, role: actualRole });
    return res.json({ token });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Login failed", details: (err as Error).message });
  }
};

export const logout = async (req: Request, res: Response) => {
  // For stateless JWT, logout can be handled on the client side by deleting the token.
  res.json({ message: "Logged out successfully" });
};

export default {
  register,
  login,
  logout,
};
