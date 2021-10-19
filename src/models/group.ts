import mongoose, { Document } from 'mongoose'
import crypto from 'crypto'

interface IGroup extends Document {
    name: string,
    subject: string,
    emoji: string,
    joinToken: string,
    users: Array<object>,
    creator: mongoose.Types.ObjectId
}

interface IGroupDocument extends IGroup, Document {
    generateJoinToken(): Promise<String>
}

const groupSchema = new mongoose.Schema<IGroup>({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    emoji: {
        type: String,
        required: false
    },
    joinToken: {
        type: String
    },
    users: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        role: {
            type: String,
            required: true,
            default: 'student',
            enum: ['student', 'creator']
        }
    }],
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
        required: true
    }
}, { timestamps: true })

groupSchema.method('generateJoinToken', async function generateJoinToken() {
    const group = this
    group.joinToken = await crypto.randomBytes(8).toString('hex')

    await group.save()

    return group.joinToken
})

const Group = mongoose.model<IGroupDocument>('Group', groupSchema)

export { Group as default }