import mongoose from 'mongoose'

export default async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.MONGODB_URL ?? '')
    } catch (e) {
        throw e
    }
}