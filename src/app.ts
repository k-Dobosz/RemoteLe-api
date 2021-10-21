import express, { Request, Response, NextFunction } from 'express'
import logger from 'morgan'
import bodyParser from 'body-parser'
import mongo from './database/db'
import cors from 'cors'

import usersRouter from './routes/users'
import groupsRouter from './routes/groups'
import topicsRouter from './routes/topics'
import errorMiddleware, { AppError } from './middleware/error'

const app = express()
const db = mongo()

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors({
    origin: '*',
    methods: 'GET, PUT, PATCH, POST, DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
}))


app.use('/api/v1/users', usersRouter)
app.use('/api/v1/groups', groupsRouter)
app.use('/api/v1/topics', topicsRouter)

app.all('*', (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Unable to find ${req.originalUrl}`, 404))
})

app.use(errorMiddleware)

export { app as default }