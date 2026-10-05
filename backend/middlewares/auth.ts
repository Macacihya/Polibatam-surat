import { Request, Response, NextFunction } from "express";
import { logWithoutConsole } from "../lib/logger";
import { User } from "../types";
import { Unauthorized } from "../utils/api-response";
import { polibatamInstance } from "../utils/axios";
import { DecryptToken } from "../utils/jwt";
import userRepository from "../app/user/user.Repository";

export const VerifyAuthToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const BearerToken = req.headers.authorization;
  if (!BearerToken) return Unauthorized({ res, message: "Unauthorized" });

  try {
    const token = BearerToken.split(" ")[1];
    if (!token) return Unauthorized({ res, message: "Unauthorized" });

    const decode = DecryptToken(token);
    if (!decode) return Unauthorized({ res, message: "Session Expired" });

    const user = await userRepository.checkOrInsertUser({
      nip: (decode as any)?.user.nip,
      secretkey: (decode as any)?.secretkey,
    });

    logWithoutConsole({
      level: "info",
      message: `${user?.nama} is accessing ${req.originalUrl}`,
    });

    req.cookies.user = user;
    req.cookies.secretkey = (decode as any)?.secretkey;
    next();
  } catch (error) {
    return Unauthorized({ res, message: "Unauthorized" });
  }
};
