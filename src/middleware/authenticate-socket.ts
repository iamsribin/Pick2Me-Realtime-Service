import { Socket } from "socket.io";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";
import {RedisService}  from "@Pick2Me/shared/redis"; 

export async function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  try {
    const rawCookie = socket.handshake.headers.cookie;
    
    if (!rawCookie) return next(new Error("no_cookies"));

    const cookies = cookie.parse(rawCookie);
    
    const accessToken = cookies.accessToken;

    if (!accessToken) return next(new Error("no_access_token"));

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as { id: string; role: string };

      const redis = RedisService.getInstance();
      const isBlacklisted = await redis.checkBlacklistedToken(decoded.id);

      if (isBlacklisted) {
        return next(new Error("user_blocked"));
      }

      socket.data.user = { id: decoded.id, role: decoded.role };
      console.log("authenticateSocket", socket.data.user);

      return next();
    } catch (err: any) {
      console.log(err);
      
      if (err.name === "TokenExpiredError") {
        return next(new Error("token_expired"));
      }
      return next(new Error("invalid_token"));
    }
  } catch (err) {
    console.error("authenticateSocket error", err);
    return next(new Error("auth_error"));
  }
}
