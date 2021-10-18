import express, { NextFunction, Request, Response } from 'express'
import auth from '../middleware/auth'
import { AppError } from '../middleware/error'
import Group from '../models/group'
const router = express.Router()

router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groups = await Group.find({ 'users.userId': req.user._id })

        if (groups.length == 0)
            return next(new AppError('No groups found', 404))

        res.status(200).send({ groups })
    } catch (e) {
        next(e)
    }
})

router.post('/', auth, async (req: Request, res: Response, next: NextFunction) => {
    const group = new Group({
        name: req.body.name,
        users: [{ userId: req.user._id }]
    })

    try {
        await group.save()

        const joinToken = await group.generateJoinToken()

        res.status(201).send({ joinToken })
    } catch (e) {
        next(e)
    }
})

router.get('/join/:joinToken', auth, async (req: Request, res: Response, next: NextFunction) => {
    const joinToken = req.params.joinToken

    try {
        const group = await Group.findOne({ joinToken })

        if (!group) {
            return next(new AppError('Your invitation token is invalid', 404))
        }

        group.users = group.users.concat({ userId: req.user._id })

        group.save()

        res.status(200).send({})
    } catch (e) {
        next(e)
    }
})

export { router as default }