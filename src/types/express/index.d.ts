import Polyglot from "node-polyglot";
import { IUserDocument } from "../../models/user";

declare global {
    namespace Express {
        interface Request {
            user: IUserDocument,
            token: string,
            polyglot: Polyglot
        }
    }
}