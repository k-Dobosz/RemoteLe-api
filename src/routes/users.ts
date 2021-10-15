import express, { Request, Response } from 'express'
import User from '../models/user'
const router = express.Router()

router.post('/', async (req: Request, res: Response) => {
    const user = new User(req.body)

    try {
        await user.save()
        const token = user.generateAuthToken()

        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send({
            error: e
        })
    }
})

router.post('/login', async (req: Request, res: Response) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)

        const token = await user.generateAuthToken()

        res.status(200).send({ user, token })
    } catch (e) {
        res.status(400).send({
            error: e
        })
    }
})

router.post('/recover', async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ email: req.body.email })

        if (!user) 
            return res.status(401).send()

        const token = await user.generatePasswordResetToken()

        res.status(200).send({ resetPasswordToken: token })

    } catch (e) {
        res.status(500).send({
            error: e
        })
    }
})

export { router as default }