import express, { NextFunction, Request, Response } from 'express'
import auth from '../middleware/auth'
import { AppError } from '../middleware/error'
import Group from '../models/group'
import User from '../models/user'
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

router.get('/:groupId', auth, async (req: Request, res: Response, next: NextFunction) => {
    const groupId = req.params.groupId

    try {
        const group = await Group.findOne({ _id: groupId })

        if (!group)
            return next(new AppError('No group found', 404))

        const users: Array<any> = group.users

        if (!users.some(item => item.userId.toString() == req.user._id.toString())) {
            return next(new AppError('You are not in this group.', 403))
        }

        let usersList: Array<any> = []

        for (let user of users) {
            const q = await User.findById(user.userId)
            if (!q) continue

            usersList.push({
                _id: q._id,
                fullname: q.fullname,
                email: q.email,
                role: q.role,
                groupRole: user.role
            })
        }

        res.status(200).send({ group: { 
            name: group.name,
            subject: group.subject,
            description: group.description,
            emoji: group.emoji,
            joinToken: group.joinToken,
            todo: group.todo,
            users: usersList,
            creator: group.creator
        }})
    } catch (e) {
        next(e)
    }
})

router.post('/', auth, async (req: Request, res: Response, next: NextFunction) => {
    const group = new Group({
        name: req.body.name,
        subject: req.body.subject,
        description: req.body.description,
        emoji: req.body.emoji,
        users: [{ userId: req.user._id, role: 'creator' }],
        creator: req.user._id
    })

    try {
        await group.save()

        const joinToken = await group.generateJoinToken()

        res.status(201).send({ _id: group._id, joinToken })
    } catch (e) {
        next(e)
    }
})

router.get('/join/:joinToken', auth, async (req: Request, res: Response, next: NextFunction) => {
    const joinToken = req.params.joinToken

    try {
        const group = await Group.findOne({ joinToken })

        if (!group) {
            return next(new AppError('Your invitation token is invalid.', 404))
        }

        const users: Array<any> = group.users

        if (users.some(item => item.userId.toString() == req.user._id.toString())) {
            return next(new AppError('You already are in this group.', 404))
        }

        group.users = group.users.concat({ userId: req.user._id })
        group.save()

        res.status(200).send()
    } catch (e) {
        next(e)
    }
})

router.patch('/:groupId', auth, async (req: Request, res: Response, next: NextFunction) => {
    const groupId = req.params.groupId
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'subject', 'description', 'emoji', 'joinToken']
    const isValid = updates.every(update => allowedUpdates.includes(update))

    if (!isValid) {
        return next(new AppError('Invalid fields', 400))
    }

    try {
        const isAllowedToUpdate = await Group.findById(groupId)

        if (!isAllowedToUpdate) {
            return next(new AppError('You are not allowed to update this group', 403))
        }

        const group = await Group.findOneAndUpdate({ _id: groupId }, req.body, { new: true })

        res.status(200).send(group)
    } catch (e) {
        next(e)
    }
})

router.delete('/', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isAllowedToDelete = await Group.find({ _id: req.body.groupId, creator: req.user._id })

        if (!isAllowedToDelete) {
            return next(new AppError('You are not allowed to delete this group', 403))
        }

        const group = await Group.deleteOne({ _id: req.body.groupId })

        res.status(200).send({})
    } catch (e) {
        next(e)
    }
})

export { router as default }