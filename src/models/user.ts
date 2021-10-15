import mongoose, { Document, Model } from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

interface IUser extends Document {
    fullname: string,
    email: string
    password: string,
    tokens: Array<object>,
    resetPasswordToken: string,
    resetPasswordTokenExpires: Date
}

interface IUserDocument extends IUser, Document {
    generateAuthToken(): Promise<String>,
    generatePasswordResetToken(): Promise<void>
}

interface UserModel extends Model<IUserDocument> {
    findByCredentials(email: String, password: String): IUserDocument
}

const userSchema = new mongoose.Schema<IUserDocument>({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
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

    if (!user) throw new Error('Unable to login')

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) throw new Error('Unable to login')

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

userSchema.pre<IUserDocument>('save', async function(next) {
    const user = this

    if (user.isModified('password'))
        user.password = await bcrypt.hash(user.password, 10)

    next()
})

const User = mongoose.model<IUserDocument, UserModel>('User', userSchema)

export { User as default, IUserDocument }