import express, { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import sgMail from '@sendgrid/mail'
import bcrypt from 'bcrypt'
import { AppError } from '../middleware/error'
import User from '../models/user'
import auth from '../middleware/auth'
import user from '../models/user'
const router = express.Router()
sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? '')
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
        return next(new AppError(req.polyglot.t('users.register.password:invalid'), 400))


    try {
        await user.save()
        const authtoken = await user.generateAuthToken()
        const emailConfirmToken = await user.generateEmailConfirmToken()

        const url = `${ process.env.FRONTEND_URL }confirm-email/${ emailConfirmToken }`

        sgMail.send({
            to: user.email,
            from: process.env.SENGRID_EMAIL ?? '',
            subject: 'Verify your email',
            text: `Hi! Click this link to verify your email address! ${ url }`
        })

        res.status(201).send({ user: {
            fullname: user.fullname,
            email: user.email,
            emailConfirmed: user.emailConfirmed,
            role: user.role
        }, token: authtoken })
    } catch (e) {
        next(e)
    }
})

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findByCredentials(req)

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
            return next(new AppError(req.polyglot.t('user.password.reset.email:notfound'), 404))

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
            return next(new AppError(req.polyglot.t('user.password.reset.email:link:expired'), 401))

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

router.post('/confirm-email/:emailConfirmToken', async (req: Request, res: Response, next: NextFunction) => {
    const emailConfirmToken = req.params.emailConfirmToken

    try {
        const user = await User.findOne({ role: 'unverified', emailConfirmToken })

        if (!user)
            return next(new AppError('Unable to confirm email', 400))

        user.role = 'student'
        user.emailConfirmToken = undefined
        await user.save()

        res.status(200).send({})
    } catch (e) {
        next(e)
    }
})


router.post('/change-email', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

        if (!email.test(req.body.email)) 
            return next(new AppError(req.polyglot.t('users.invalid.email'), 400))

        req.user.email = req.body.email
        req.user.save()

        res.status(200).send({ 
            user: {
                fullname: req.user.fullname,
                email: req.user.email,
                emailConfirmed: req.user.emailConfirmed,
                avatar: req.user.avatar,
                role: req.user.role
            }
        })
    } catch (e) {
        next(e)
    }
})

router.post('/change-password', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const password = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,32}$/

        if (!password.test(req.body.newPassword))
            return next(new AppError(req.polyglot.t('users.invalid.password:new'), 400))

        const isMatch = await bcrypt.compare(req.body.password, req.user.password)

        if (!isMatch)
            return next(new AppError(req.polyglot.t('users.invalid.password:old'), 400))

        req.user.password = req.body.newPassword
        req.user.save()

        res.status(200).send({ 
            user: {
                fullname: req.user.fullname,
                email: req.user.email,
                emailConfirmed: req.user.emailConfirmed,
                avatar: req.user.avatar,
                role: req.user.role
            }
        })
    } catch (e) {
        next(e)
    }
})

export { router as default }