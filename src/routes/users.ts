import express, { Request, Response } from 'express'
import User, { UserModel } from '../models/user'
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

        const token = user.generateAuthToken()

        res.status(200).send({ user, token })
    } catch (e) {
        res.status(400).send({
            error: e
        })
    }
})

export { router as default }