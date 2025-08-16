import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  status?: string
}

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.statusCode || 500
  const status = err.status || 'error'

  console.error('Error:', err)

  res.status(statusCode).json({
    status,
    message: err.message || 'Internal server error'
  })
}

export function createError(message: string, statusCode: number = 500): AppError {
  const error = new Error(message) as AppError
  error.statusCode = statusCode
  return error
}