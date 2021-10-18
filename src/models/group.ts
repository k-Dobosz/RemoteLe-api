import mongoose, { Document } from 'mongoose'
import crypto from 'crypto'

interface IGroup extends Document {
    name: string,
    joinToken: string,
    users: Array<object>,
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
    joinToken: {
        type: String
    },
    users: [{
        userId: {
            type: mongoose.Types.ObjectId,
            required: true
        }
    }]
}, { timestamps: true })

groupSchema.method('generateJoinToken', async function generateJoinToken() {
    const group = this
    group.joinToken = await crypto.randomBytes(8).toString('hex')

    await group.save()

    return group.joinToken
})

const Group = mongoose.model<IGroupDocument>('Group', groupSchema)

export { Group as default }