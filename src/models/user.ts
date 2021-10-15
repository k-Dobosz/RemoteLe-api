import mongoose, { Document, Model } from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

interface IUser extends Document {
    email: string
    password: string,
    tokens: Array<object>
}

interface IUserDocument extends IUser, Document {
    generateAuthToken(): Promise<String>
}

interface UserModel extends Model<IUserDocument> {
    findByCredentials(email: String, password: String): IUserDocument
}

const userSchema = new mongoose.Schema<IUserDocument>({
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
    }]
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

userSchema.pre<IUserDocument>('save', async function(next) {
    const user = this

    if (user.isModified('password'))
        user.password = await bcrypt.hash(user.password, 10)

    next()
})

const User = mongoose.model<IUserDocument, UserModel>('User', userSchema)

export { User as default, UserModel }