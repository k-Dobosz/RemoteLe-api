declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT?: string,
            MONGODB_URL: string,
            JWT_TOKEN_SECRET: string,
            SENGRID_EMAIL: string,
            SENDGRID_API_KEY: string,
            FRONTEND_URL: string
        }
    }
}

export {}