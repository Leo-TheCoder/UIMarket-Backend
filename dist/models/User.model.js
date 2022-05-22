"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const UserSchema = new mongoose_1.default.Schema({
    customerName: {
        type: String,
        required: [true, "Please provide name"],
        minlength: 5,
    },
    customerAvatar: {
        type: String,
        required: false,
    },
    shopId: {
        type: mongoose_1.default.Types.ObjectId,
        default: null,
    },
    customerEmail: {
        type: String,
        required: [true, "Please provide email"],
        unique: true,
        immutable: true,
    },
    customerPassword: {
        type: String,
        required: [true, "Please provide password"],
    },
    customerPhone: {
        type: String,
        default: null,
    },
    customerDOB: {
        type: Date,
        default: null,
    },
    authenToken: {
        required: false,
        Google: {
            type: String,
            default: null,
        },
    },
    customerWallet: {
        coin: {
            type: Number,
            default: 0,
        },
        point: {
            type: Number,
            default: 0,
        },
    },
    customerStatus: {
        type: Number,
        default: 0,
        enum: [0, 1],
    },
    customerBio: {
        type: String,
        default: null,
    },
    refreshToken: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});
UserSchema.methods.hashPassword = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const salt = yield bcryptjs_1.default.genSalt(10);
        this.customerPassword = yield bcryptjs_1.default.hash(this.customerPassword, salt);
    });
};
UserSchema.methods.createJWT = function () {
    return jsonwebtoken_1.default.sign({
        userId: this._id,
        shopId: this.shopId,
        name: this.customerName,
        isActive: this.customerStatus === 1,
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_LIFETIME,
    });
};
UserSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function* () {
        const isMatch = yield bcryptjs_1.default.compare(candidatePassword, this.customerPassword);
        return isMatch;
    });
};
UserSchema.methods.createRefreshToken = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const token = jsonwebtoken_1.default.sign({ userId: this._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_REFRESHTOKEN_LIFETIME, //1 day
        });
        this.refreshToken = token;
        return token;
    });
};
UserSchema.methods.verifyToken = function (token) {
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        return payload.userId;
    }
    catch (error) {
        return null;
    }
};
UserSchema.methods.compareToken = function (candidateToken) {
    return candidateToken === this.refreshToken;
};
UserSchema.methods.createAccountWithGoogleID = function (customerName, googleId, customerEmail, customerAvatar) {
    return __awaiter(this, void 0, void 0, function* () {
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.customerAvatar = customerAvatar;
        this.authenToken.Google = googleId;
        //active account
        this.customerStatus = 1;
        //random password
        this.customerPassword = (0, uuid_1.v4)();
        yield this.hashPassword();
        yield this.save();
    });
};
UserSchema.methods.doesAccountCreatedWithGoogle = function () {
    return this.authenToken.Google ? true : false;
};
UserSchema.methods.verifyGoogleID = function (googleId) {
    return this.authenToken.Google === googleId;
};
UserSchema.methods.updateAccountWithGoogle = function (googleId, customerAvatar) {
    return __awaiter(this, void 0, void 0, function* () {
        this.customerStatus = 1;
        this.authenToken.Google = googleId;
        if (!this.customerAvatar) {
            this.customerAvatar = customerAvatar;
        }
        yield this.save();
    });
};
exports.default = mongoose_1.default.model("Customer", UserSchema);
//# sourceMappingURL=User.model.js.map