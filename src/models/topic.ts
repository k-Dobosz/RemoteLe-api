import mongoose, { Document } from 'mongoose'

interface ITopic extends Document {
    name: string,
    description: string,
    components: object,
    creator: mongoose.Types.ObjectId
}

const topicSchema = new mongoose.Schema<ITopic>({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    components: { 
        type: Object,
        required: true
     },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
        required: true
    }
}, { timestamps: true })

const Topic = mongoose.model<ITopic>('Topic', topicSchema)

export { Topic as default, ITopic }