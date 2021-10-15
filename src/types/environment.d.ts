declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT?: string,
            MONGODB_URL: string,
            JWT_TOKEN_SECRET: string
        }
    }
}

export {}