import { NextFunction, Request, Response } from "express"

interface AppError {
    name: string,
    statusCode: number,
    code?: number,
    path?: string,
    value?: string,
    errors: object
}

class AppError extends Error {
    constructor(message: string, statusCode: number) {
        super(message)

        this.statusCode = statusCode

        Error.captureStackTrace(this, this.constructor)
    }
}

const errorMiddleware = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500
    err.message = err.message || req.polyglot.t('errors.unexpected') || 'Unexpected error occured.'

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).send({
            statusCode: err.statusCode,
            message: err.message,
            error: err
        })
    } else if (process.env.NODE_ENV === 'production') {
        if (err.name === 'CastError') {
            res.status(400).send({
                error: `Invalid ${err.path}: ${err.value}`
            })
        } else if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message.replace('.', ''))

            res.status(400).send({
                error: `Invalid input data. ${errors.join('. ')}`
            })
        }
        else if (err.code && err.code == 11000) {
            res.status(409).send({ error: 'Duplicate value error' })
        } else {
            res.status(err.statusCode).send({
                error: err.message
            })
        }
    }
}

export { errorMiddleware as default, AppError }