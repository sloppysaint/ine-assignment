import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { User } from '../models/user'

export interface AuthRequest extends Request {
  user?: User
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string }
    const user = await User.findByPk(decoded.userId)

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token

  if (!token) {
    return next()
  }

  jwt.verify(token, env.JWT_SECRET, async (err:any, decoded:any) => {
    if (!err && decoded && typeof decoded === 'object' && 'userId' in decoded) {
      try {
        const user = await User.findByPk(decoded.userId)
        if (user) {
          req.user = user
        }
      } catch (error) {
        // Ignore auth errors for optional auth
      }
    }
    next()
  })
}