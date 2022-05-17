"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.captureOrder = exports.chargeCoin = exports.authorizationEndpoint = exports.returnAfterLoginPaypal = exports.payoutOrder = exports.cancelPayment = exports.createOrder = void 0;
const axios_1 = __importDefault(require("axios"));
const http_status_codes_1 = require("http-status-codes");
const uuid_1 = require("uuid");
const Shop_model_1 = __importDefault(require("../models/Shop.model"));
const unauthenticated_error_1 = __importDefault(require("../errors/unauthenticated-error"));
const ErrorMessage = __importStar(require("../errors/error_message"));
const errors_1 = require("../errors");
const PAYPAL_API_CLIENT = process.env.PAYPAL_API_CLIENT;
const PAYPAL_API_SECRET = process.env.PAYPAL_API_SECRET;
const DOMAIN_NAME = process.env.DOMAIN_NAME;
const getAccessToken = () => __awaiter(void 0, void 0, void 0, function* () {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    const { data: { access_token }, } = yield axios_1.default.post("https://api-m.sandbox.paypal.com/v1/oauth2/token", params, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
            username: PAYPAL_API_CLIENT,
            password: PAYPAL_API_SECRET,
        },
    });
    return access_token;
});
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    description: "This is product order",
                    amount: {
                        currency_code: "USD",
                        value: "100.00",
                        breakdown: {
                            item_total: {
                                currency_code: "USD",
                                value: "100.00",
                            },
                        },
                    },
                    items: [
                        {
                            name: "Website Marketplace Templete by LeoTheCoder",
                            unit_amount: {
                                currency_code: "USD",
                                value: "100.00",
                            },
                            quantity: "1",
                            description: "Website Template",
                        },
                    ],
                },
            ],
            application_context: {
                brand_name: "deexmarket.com",
                landing_page: "NO_PREFERENCE",
                user_action: "PAY_NOW",
                return_url: `${DOMAIN_NAME}/api/v1/payment/capture-order`,
                cancel_url: `${DOMAIN_NAME}/api/v1/payment/cancel-payment`,
            },
        };
        const access_token = yield getAccessToken();
        // make a request
        const response = yield axios_1.default.post(`${process.env.PAYPAL_API}/v2/checkout/orders`, order, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        res.json(response.data);
    }
    catch (error) {
        console.log(error);
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
});
exports.createOrder = createOrder;
const cancelPayment = (req, res) => {
    res.status(http_status_codes_1.StatusCodes.OK).send("Cancel Payment!");
};
exports.cancelPayment = cancelPayment;
const payoutOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { amountValue } = req.body;
    //get email or paypal id from db
    const { shopId } = user;
    const shop = yield Shop_model_1.default.findById(shopId, "shopPayPal");
    if (!shop) {
        throw new unauthenticated_error_1.default(ErrorMessage.ERROR_INVALID_SHOP_ID);
    }
    if (!shop.shopPayPal.paypalEmail) {
        throw new unauthenticated_error_1.default(ErrorMessage.ERROR_PAYPAL_INVALID);
    }
    const receiver = shop.shopPayPal.paypalEmail;
    const payoutObj = {
        sender_batch_header: {
            sender_batch_id: (0, uuid_1.v4)(),
            email_subject: "You have a payout!",
            email_message: "You have receive a payout! Thanks for using our service!",
        },
        items: [
            {
                recipient_type: "EMAIL",
                amount: {
                    value: amountValue,
                    currency: "USD",
                },
                receiver: receiver,
            },
        ],
    };
    try {
        //const access_token = await getAccessToken();
        const response = yield axios_1.default.post(`${process.env.PAYPAL_API}/v1/payments/payouts`, payoutObj, {
            auth: {
                username: PAYPAL_API_CLIENT,
                password: PAYPAL_API_SECRET,
            },
        });
        //update point
        res.status(http_status_codes_1.StatusCodes.OK).json(response.data);
    }
    catch (error) {
        console.log(error);
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
});
exports.payoutOrder = payoutOrder;
const returnAfterLoginPaypal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const authorization_base64 = Buffer.from(`${PAYPAL_API_CLIENT}:${PAYPAL_API_SECRET}`).toString("base64");
    //GET ACCESS TOKEN
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", query.code.toString());
    const response = yield axios_1.default.post(`https://api-m.sandbox.paypal.com/v1/oauth2/token`, params, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${authorization_base64}`,
        },
    });
    const { access_token } = response.data;
    const profileInfo = yield axios_1.default.get(`https://api-m.sandbox.paypal.com/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
        },
    });
    //store paypal info into db
    const { shopId } = req.user;
    const profile = profileInfo.data;
    const email = profile.emails[0].value;
    const paypalId = profile.payer_id;
    const shop = yield Shop_model_1.default.findById(shopId, "shopPayPal");
    shop.shopPayPal.paypalEmail = email;
    shop.shopPayPal.paypalId = paypalId;
    yield shop.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        msg: "Connect paypal to your shop account successfully!",
        paypal_profile: {
            email,
            paypalId,
        },
    });
});
exports.returnAfterLoginPaypal = returnAfterLoginPaypal;
const authorizationEndpoint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { shopId } = user;
    const returnURL = encodeURIComponent(`http://127.0.0.1:3000/return-paypal`);
    const url = `https://www.sandbox.paypal.com/connect?flowEntry=static&client_id=${PAYPAL_API_CLIENT}&scope=openid profile email https://uri.paypal.com/services/paypalattributes&redirect_uri=${returnURL}`;
    return res.status(http_status_codes_1.StatusCodes.OK).json({ url });
});
exports.authorizationEndpoint = authorizationEndpoint;
const chargeCoin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    const { amountValue } = req.body;
    const order = {
        intent: "CAPTURE",
        purchase_units: [
            {
                description: `Deposit money to your account`,
                amount: {
                    currency_code: "USD",
                    value: amountValue,
                },
            },
        ],
        application_context: {
            brand_name: "deexmarket.com",
            landing_page: "NO_PREFERENCE",
            user_action: "PAY_NOW",
            return_url: `${DOMAIN_NAME}/api/v1/payment/capture-order?amount=${amountValue}`,
            cancel_url: `${DOMAIN_NAME}/api/v1/payment/cancel-payment`,
        },
    };
    const access_token = yield getAccessToken();
    // make a request
    const response = yield axios_1.default.post(`${process.env.PAYPAL_API}/v2/checkout/orders`, order, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
    res.json(response.data);
});
exports.chargeCoin = chargeCoin;
const captureOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, amount } = req.query;
    try {
        const response = yield axios_1.default.post(`${process.env.PAYPAL_API}/v2/checkout/orders/${token}/capture`, {}, {
            auth: {
                username: PAYPAL_API_CLIENT,
                password: PAYPAL_API_SECRET,
            },
        });
        //Update point
        //...
        res.status(http_status_codes_1.StatusCodes.OK).json({
            data: response.data,
            amount,
        });
    }
    catch (error) {
        console.log(error);
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
});
exports.captureOrder = captureOrder;
//# sourceMappingURL=payment.controller.js.map