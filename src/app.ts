import express, { Request, Response, NextFunction } from 'express'
import logger from 'morgan'
import bodyParser from 'body-parser'
import mongo from './database/db'

import usersRouter from './routes/users'

const app = express()
const db = mongo()

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/api/v1/users', usersRouter)

app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
    if(req.method === "OPTIONS") {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
        return res.status(200).json({})
    }
    next()
})

app.all('*', (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        error: `Unable to find ${req.originalUrl}`
    })
})

export { app as default }