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
            return next(new AppError(req.polyglot.t('grups.notfound.many'), 404))

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
            return next(new AppError(req.polyglot.t('grups.notfound.one'), 404))

        const users: Array<any> = group.users

        if (!users.some(item => item.userId.toString() == req.user._id.toString())) {
            return next(new AppError(req.polyglot.t('grups.notallowed.view'), 403))
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
                groupRole: user.groupRole
            })
        }

        res.status(200).send({ group: { 
            _id: group._id,
            name: group.name,
            subject: group.subject,
            description: group.description,
            emoji: group.emoji,
            joinToken: group.joinToken,
            todos: group.todos,
            users: usersList,
            creator: group.creator
        }})
    } catch (e) {
        next(e)
    }
})

router.get('/:groupId/todos/', auth, async (req: Request, res: Response, next: NextFunction) => {
    const groupId = req.params.groupId

    try {
        const groups = await Group.findById(groupId)

        if (!groups)
            return next(new AppError(req.polyglot.t('grups.notfound.one'), 404))

        if(groups.todos.length == 0)
            return next(new AppError(req.polyglot.t('grups.notfound.many:todo'), 404))


        res.status(200).send({ todos: groups.todos })
    } catch (e) {
        next(e)
    }
})

router.post('/:groupId/todos/', auth, async (req: Request, res: Response, next: NextFunction) => {
    const groupId = req.params.groupId

    try {
        const group = await Group.findById(groupId)

        if (!group)
            return next(new AppError(req.polyglot.t('grups.notfound.one'), 404))

        group.todos = [...group.todos, { text: req.body.text }]
        await group.save()

        return res.status(200).send({ todo: group.todos[group.todos.length - 1] })
    } catch (e) {
        next(e)
    }
})

router.delete('/:groupId/todos/:todoId', auth, async (req: Request, res: Response, next: NextFunction) => {
    const groupId = req.params.groupId
    const todoId = req.params.todoId
    
    try {
        const group = await Group.findOne({ _id: groupId, creator: req.user._id })

        if (!group) {
            return next(new AppError(req.polyglot.t('grups.notallowed.delete:todo'), 403))
        }

        group.todos = group.todos.filter((todo: any) => {
            return todo._id.toString() != todoId
        })
        group.save()

        res.status(200).send()
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
        users: [{ userId: req.user._id, groupRole: 'creator' }],
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

router.post('/join/:joinToken', auth, async (req: Request, res: Response, next: NextFunction) => {
    const joinToken = req.params.joinToken

    try {
        const group = await Group.findOne({ joinToken })

        if (!group) {
            return next(new AppError(req.polyglot.t('groups.invalid.token'), 404))
        }

        const users: Array<any> = group.users

        if (users.some(item => item.userId.toString() == req.user._id.toString())) {
            return next(new AppError(req.polyglot.t('grups.already:joined'), 404))
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
        return next(new AppError(req.polyglot.t('groups.invalid.fields'), 400))
    }

    try {
        const isAllowedToUpdate = await Group.findById(groupId)

        if (!isAllowedToUpdate) {
            return next(new AppError(req.polyglot.t('grups.notallowed.update'), 403))
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
            return next(new AppError(req.polyglot.t('grups.notallowed.delete'), 403))
        }

        const group = await Group.deleteOne({ _id: req.body.groupId })

        res.status(200).send({})
    } catch (e) {
        next(e)
    }
})

export { router as default }