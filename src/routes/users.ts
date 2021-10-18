import express, { NextFunction, Request, Response } from 'express'
import { AppError } from '../middleware/error'
import User from '../models/user'
const router = express.Router()

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    const pass = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,32}$/
    
    const user = new User({
        fullname: req.body.fullname,
        email: req.body.email,
        password: req.body.password
    })

    if (!pass.test(user.password))
        return next(new AppError('Password is invalid.', 400))


    try {
        await user.save()
        const token = await user.generateAuthToken()

        res.status(201).send({ user: {
            fullname: user.fullname,
            email: user.email,
            emailConfirmed: user.emailConfirmed
        }, token })
    } catch (e) {
        next(e)
    }
})

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)

        const token = await user.generateAuthToken()

        res.status(200).send({ user: {
            fullname: user.fullname,
            email: user.email,
            emailConfirmed: user.emailConfirmed
        }, token })
    } catch (e) {
        next(e)
    }
})

router.post('/recover', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findOne({ email: req.body.email })

        if (!user) 
            return next(new AppError('User with this email not found', 404))

        const token = await user.generatePasswordResetToken()

        res.status(200).send({ resetPasswordToken: token })

    } catch (e) {
        next(e)
    }
})

router.post('/reset', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findOne({ 
            resetPasswordToken: req.body.resetPasswordToken, 
            resetPasswordTokenExpires: { $gte: new Date(Date.now()) } 
        })

        if (!user)
            return next(new AppError('Your password reset link expired', 401))

        user.password = req.body.password
        user.save()

        res.status(200).send({})
    } catch (e) {
        next(e)
    }
})

router.get('/reset/check-token/:resetPasswordToken', async (req: Request, res: Response, next: NextFunction) => {
    const resetPasswordToken = req.params.resetPasswordToken

    try {
        const user = await User.findOne({ resetPasswordToken, resetPasswordTokenExpires: { $gte: new Date(Date.now()) } })

        if (!user)
            return next(new AppError('Your password reset link expired', 401))

        res.status(200).send({})
    } catch (e) {
        next(e)
    }
})

export { router as default }