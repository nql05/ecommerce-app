import { Request, Response } from "express";
import { comparePassword, generateToken } from "../utils/auth";
import userService from "../services/userService";

export const login = async (req: Request, res: Response) => {
  try {
    const { loginName, password, role } = req.body;
    if (!loginName || !password || !role)
      return res.status(400).json({ error: "Missing credentials" });

    // quick dev-only shortcut
    if (loginName === "deptrai" && password === "deptrai") {
      const token = generateToken({ loginName, role });
      return res.json({ token, role, loginName });
    }

    // console.log(loginName, password, role);

    // Lookup user in DB
    const user = await userService.findByLoginName(loginName);
    // console.log(user);
    if (!user) {
      // console.log("Invalid User")
      return res.status(400).json({ error: "Invalid credentials" });
    }


    // Compare password
    const passwordMatches = await comparePassword(
      password,
      (user as any).Password
    );

    // console.log(passwordMatches)

    if (!passwordMatches)
      return res.status(400).json({ error: "Invalid credentials" });

    // Determine role from relations (raw SQL returns flat structure with LEFT JOIN)
    const actualRole =
      (user as any).MoneySpent !== null
        ? "B"
        : (user as any).ShopName !== null || (user as any).SellerName !== null
        ? "S"
        : "A";
    if (role !== actualRole)
      return res.status(403).json({ error: "Unauthorized role" });

    // console.log("Logic success");

    const token = generateToken({
      loginName: (user as any).LoginName,
      role: actualRole,
    });
    return res.json({
      token,
      role: actualRole,
      loginName: (user as any).LoginName,
    });
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

export const getProfile = async (req: Request, res: Response) => {
  try {
    const loginName = (req as any).user.loginName;
    const profile = await userService.getUserProfile(loginName);

    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(profile);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch profile",
      details: (err as Error).message,
    });
  }
};

export default {
  login,
  logout,
  getProfile,
};
