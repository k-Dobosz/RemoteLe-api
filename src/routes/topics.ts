import express, { NextFunction, Request, Response } from 'express'
import auth from '../middleware/auth'
import { AppError } from '../middleware/error'
import Topic from '../models/topic'
const router = express.Router()

router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const topics = await Topic.find({ 'creator': req.user._id })

        if (req.user.role == 'student') {
            return next(new AppError(req.polyglot.t('topics.notallowed.view'), 403))
        }

        if (topics.length == 0)
            return next(new AppError(req.polyglot.t('topics.notfound'), 404))

        res.status(200).send({ topics })
    } catch (e) {
        next(e)
    }
})

router.get('/:topicId', auth, async (req: Request, res: Response, next: NextFunction) => {
    const topicId = req.params.topicId

    try {
        const topic = await Topic.findOne({ _id: topicId })

        if (!topic)
            return next(new AppError(req.polyglot.t('topics.notfound'), 404))


        res.status(200).send({ topic })
    } catch (e) {
        next(e)
    }
})

router.post('/', auth, async (req: Request, res: Response, next: NextFunction) => {
    const topic = new Topic({
        name: req.body.name,
        description: req.body.description,
        components: req.body.components,
        creator: req.user._id
    })

    try {
        await topic.save()

        res.status(201).send({ topic })
    } catch (e) {
        next(e)
    }
})

router.patch('/:topicId', auth, async (req: Request, res: Response, next: NextFunction) => {
    const topicId = req.params.topicId
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'description', 'components']
    const isValid = updates.every(update => allowedUpdates.includes(update))

    if (!isValid) {
        return next(new AppError(req.polyglot.t('topics.invalid.fields'), 400))
    }

    try {
        const isAllowedToUpdate = await Topic.findById(topicId)

        if (!isAllowedToUpdate) {
            return next(new AppError(req.polyglot.t('topics.notallowed.update'), 403))
        }

        const group = await Topic.findOneAndUpdate({ _id: topicId }, req.body, { new: true })

        res.status(200).send({ group })
    } catch (e) {
        next(e)
    }
})

router.delete('/:topicId', auth, async (req: Request, res: Response, next: NextFunction) => {
    const topicId = req.params.topicId
    
    try {
        const isAllowedToDelete = await Topic.find({ _id: topicId, creator: req.user._id })

        if (!isAllowedToDelete) {
            return next(new AppError(req.polyglot.t('topics.notallowed.delete'), 403))
        }

        await Topic.deleteOne({ _id: topicId })

        res.status(200).send({})
    } catch (e) {
        next(e)
    }
})

export { router as default }