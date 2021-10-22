import mongoose, { Document, Model } from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import validator from 'validator'
import { AppError } from '../middleware/error'

interface IUser extends Document {
    fullname: string,
    email: string
    password: string,
    avatar: Buffer,
    role: string,
    emailConfirmed: boolean,
    emailConfirmToken?: string,
    tokens: Array<object>,
    resetPasswordToken: string,
    resetPasswordTokenExpires: Date
}

interface IUserDocument extends IUser, Document {
    generateAuthToken(): Promise<String>,
    generatePasswordResetToken(): Promise<String>,
    generateEmailConfirmToken(): Promise<String>
}

interface UserModel extends Model<IUserDocument> {
    findByCredentials(email: String, password: String): IUserDocument
}

const userSchema = new mongoose.Schema<IUserDocument>({
    fullname: {
        type: String,
        required: true,
        trim: true,
        match: [/^[a-zA-Z\p{L}]+ [a-zA-Z\p{L}]+$/u, 'Name is invalid.']
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        validate(value: string) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid.')
            }
        }
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: mongoose.Schema.Types.Buffer,
        required: false
    },
    role: {
        type: String,
        required: true,
        default: 'unverified',
        enum: ['unverified', 'student', 'teacher', 'admin']
    },
    emailConfirmed: {
        type: Boolean,
        required: true,
        default: false
    },
    emailConfirmToken: {
        type: String,
        required: false
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordTokenExpires: {
        type: Date,
        required: false
    }
}, { timestamps: true })

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    return userObject
}

userSchema.static('findByCredentials', async function findByCredentials(email, password) {
    const user = await this.findOne({ email })

    if (!user) throw new AppError('Unable to login.', 400)

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) throw new AppError('Unable to login.', 400)

    return user
})

userSchema.method('generateAuthToken', async function generateAuthToken() {
    const user = this
    const token: String = jwt.sign({ _id: user._id.toString() }, process.env.JWT_TOKEN_SECRET as jwt.Secret)

    user.tokens = [...user.tokens, { token }]
    await user.save()

    return token
})

userSchema.method('generatePasswordResetToken', async function generatePasswordResetToken() {
    const user = this
    user.resetPasswordToken = await crypto.randomBytes(24).toString('hex')
    user.resetPasswordTokenExpires = new Date(Date.now() + 180000)

    await user.save()

    return user.resetPasswordToken
})

userSchema.method('generateEmailConfirmToken', async function generateEmailConfirmToken() {
    const user = this
    user.emailConfirmToken = await crypto.randomBytes(24).toString('hex')

    await user.save()

    return user.emailConfirmToken
})

userSchema.pre<IUserDocument>('save', async function(next) {
    const user = this

    if (user.isModified('password'))
        user.password = await bcrypt.hash(user.password, 10)

    next()
})

const User = mongoose.model<IUserDocument, UserModel>('User', userSchema)

export { User as default, IUserDocument }