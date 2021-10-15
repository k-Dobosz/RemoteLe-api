import express, { Request, Response, NextFunction } from 'express'
import logger from 'morgan'
import bodyParser from 'body-parser'
import mongo from './database/db'
import cors from 'cors'

import usersRouter from './routes/users'

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

app.all('*', (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        error: `Unable to find ${req.originalUrl}`
    })
})

export { app as default }