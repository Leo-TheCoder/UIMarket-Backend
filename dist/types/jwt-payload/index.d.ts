import jwt from "jsonwebtoken";
export interface IPayloadUser extends jwt.JwtPayload {
    userId: string;
    shopId: string;
    name: string;
    isActive: boolean;
}
//# sourceMappingURL=index.d.ts.map