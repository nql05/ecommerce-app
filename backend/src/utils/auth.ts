import jwt from "jsonwebtoken";

export const comparePassword = async (password: string, hash: string) => {
  // return await bcrypt.compare(password, hash);

  // Now we use simple version, later add registration with hashed password
  return password == hash;
};

export const generateToken = (payload: object) => {
  return jwt.sign(payload, process.env.JWT_SECRET || "secret", {
    expiresIn: "1h",
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET || "secret");
};
