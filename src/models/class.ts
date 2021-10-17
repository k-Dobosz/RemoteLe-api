import mongoose, { Document } from 'mongoose'

interface IClass extends Document {
    name: string,
    joinToken: string,
    users: Array<object>,
}

const classSchema = new mongoose.Schema<IClass>({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    joinToken: {
        type: String,
        required: true
    },
    users: [{
        userId: {
            type: mongoose.Types.ObjectId,
            required: true
        }
    }]
}, { timestamps: true })

const Class = mongoose.model<IClass>('Class', classSchema)

export { Class as default }