import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/user'
import { AppError } from './error'

interface Payload {
    _id: string,
    iat: number,
}

const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.split(' ')[1]

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET as jwt.Secret) as unknown as Payload
            const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

            if (user) {
                req.token = token
                req.user = user
                next()
            } else {
                res.status(401).send({
                    error: 'Unable to authenticate'
                })
            }
        } else {
            res.status(401).send({
                error: 'Authorization token not provided'
            })
        }
    } catch (e) {
        res.status(500).send({
            error: e
        })
    }
}

export { auth as default }