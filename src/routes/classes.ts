import express, { NextFunction, Request, Response } from 'express'
import auth from '../middleware/auth'
import { AppError } from '../middleware/error'
import Class from '../models/class'
const router = express.Router()

router.post('/', auth, async (req: Request, res: Response, next: NextFunction) => {
    const _class = new Class(req.body)

    try {
        await _class.save()

        res.status(201).send({})
    } catch (e) {
        next(e)
    }
})

router.get('/join/:joinToken', auth, async (req: Request, res: Response, next: NextFunction) => {
    const joinToken = req.params.joinToken

    try {
        const _class = await Class.findOne({ joinToken })

        if (!_class) {
            return next(new AppError('Your invitation token is invalid', 404))
        }

        _class.users = _class.users.concat({ userId: req.user._id })

        _class.save()


        res.status(200).send({})
    } catch (e) {
        next(e)
    }
})

export { router as default }