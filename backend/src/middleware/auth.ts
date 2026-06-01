import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthPayload {
  adminId: string;
  email: string;
}

export interface AuthRequest extends Request {
  admin?: AuthPayload;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized - No token" });
      return;
    }

    const token = header.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Unauthorized - Invalid token format" });
      return;
    }

    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;

    req.admin = payload;
    next();
  } catch (error) {
    console.error("AUTH ERROR:", error);

    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}
