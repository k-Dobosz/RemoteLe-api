import express, { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { AppError } from '../middleware/error'
import User from '../models/user'
import auth from '../middleware/auth'
const router = express.Router()
const upload = multer({
    limits: { fileSize: 625000 },
    fileFilter(req: Request, file: Express.Multer.File, cb) {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new AppError("Please upload png, jpeg or jpg", 400));
      }
      cb(null, true);
    }
  })

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
            emailConfirmed: user.emailConfirmed,
            role: user.role
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
            emailConfirmed: user.emailConfirmed,
            avatar: user.avatar,
            role: user.role
        }, token })
    } catch (e) {
        next(e)
    }
})

router.post('/avatar', auth, upload.single('avatar'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file)
            return next(new AppError('No avatar uploaded', 400))

        const avatar = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()

        req.user.avatar = avatar
        await req.user.save()

        res.status(200).send({ avatar })
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