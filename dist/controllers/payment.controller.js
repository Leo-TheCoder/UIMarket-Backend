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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestRefund = exports.paymentHistory = exports.captureOrder = exports.chargeCoin = exports.authorizationEndpoint = exports.returnAfterLoginPaypal = exports.withdrawPayment = exports.cancelPayment = exports.refundPayment = exports.createOrder = void 0;
//Library
const axios_1 = __importDefault(require("axios"));
const http_status_codes_1 = require("http-status-codes");
const Constants = __importStar(require("../constants"));
//Model
const Shop_model_1 = __importDefault(require("../models/Shop.model"));
const Invoice_model_1 = __importDefault(require("../models/Invoice.model"));
const Refund_model_1 = __importDefault(require("../models/Refund.model"));
const UserTransaction_model_1 = __importDefault(require("../models/UserTransaction.model"));
const License_model_1 = __importDefault(require("../models/License.model"));
//Error
const unauthenticated_error_1 = __importDefault(require("../errors/unauthenticated-error"));
const ErrorMessage = __importStar(require("../errors/error_message"));
const errors_1 = require("../errors");
//Ultis
const invoice_controller_1 = require("./invoice.controller");
const currencyTransaction_1 = require("../utils/currencyTransaction");
const paypal_1 = require("../utils/paypal");
const system_controller_1 = require("./admin/system.controller");
const PAYPAL_API_CLIENT = process.env.PAYPAL_API_CLIENT;
const PAYPAL_API_SECRET = process.env.PAYPAL_API_SECRET;
const DOMAIN_NAME = process.env.DOMAIN_NAME;
const getAccessToken = async () => {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    const { data: { access_token }, } = await axios_1.default.post("https://api-m.sandbox.paypal.com/v1/oauth2/token", params, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
            username: PAYPAL_API_CLIENT,
            password: PAYPAL_API_SECRET,
        },
    });
    return access_token;
};
const createOrder = async (req, res) => {
    const invoice = (await (0, invoice_controller_1.createOrder)(req));
    const productList = invoice.productList;
    const buyerFee = (await (0, system_controller_1.getSystemDocument)()).buyerFee;
    try {
        const response = await (0, paypal_1.CreateOrder_PayPal)(productList, invoice, buyerFee);
        res.json({
            paypal_link: response,
            invoiceId: invoice._id,
        });
    }
    catch (error) {
        console.log(error);
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.createOrder = createOrder;
//Error
const refundPayment = async (req, res) => {
    const { access_token } = await getAccessToken();
    const { token } = req.body;
    let response = {};
    try {
        response = await axios_1.default.post(`${process.env.PAYPAL_API}/v2/payments/captures/${token}/refund`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
    }
    catch (err) {
        console.log(err);
    }
    res.json(response.data);
};
exports.refundPayment = refundPayment;
const cancelPayment = (req, res) => {
    res.status(http_status_codes_1.StatusCodes.OK).send("Cancel Payment!");
};
exports.cancelPayment = cancelPayment;
const withdrawPayment = async (req, res) => {
    const { amountValue } = req.body;
    //get email or paypal id from db
    const { shopId } = req.user;
    const shop = await Shop_model_1.default.findById(shopId);
    if (!shop) {
        throw new unauthenticated_error_1.default(ErrorMessage.ERROR_INVALID_SHOP_ID);
    }
    if (!shop.shopPayPal.paypalEmail) {
        throw new unauthenticated_error_1.default(ErrorMessage.ERROR_PAYPAL_INVALID);
    }
    const receiver = shop.shopPayPal.paypalEmail;
    try {
        //update coin
        const response = await (0, paypal_1.Payout_PayPal)(amountValue, receiver);
        const transaction = await (0, currencyTransaction_1.shopWithdrawTransaction)(shop, `Withdraw from system $${amountValue}`, -amountValue).catch((err) => console.log(err));
        res.status(http_status_codes_1.StatusCodes.OK).json({
            response: response?.data,
            transaction,
        });
    }
    catch (error) {
        console.log(error);
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.withdrawPayment = withdrawPayment;
const returnAfterLoginPaypal = async (req, res) => {
    const query = req.query;
    const authorization_base64 = Buffer.from(`${PAYPAL_API_CLIENT}:${PAYPAL_API_SECRET}`).toString("base64");
    //GET ACCESS TOKEN
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", query.code.toString());
    const response = await axios_1.default.post(`https://api-m.sandbox.paypal.com/v1/oauth2/token`, params, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${authorization_base64}`,
        },
    });
    const { access_token } = response.data;
    const profileInfo = await axios_1.default.get(`https://api-m.sandbox.paypal.com/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
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
    const shop = await Shop_model_1.default.findById(shopId, "shopPayPal");
    shop.shopPayPal.paypalEmail = email;
    shop.shopPayPal.paypalId = paypalId;
    await shop.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        msg: "Connect paypal to your shop account successfully!",
        paypal_profile: {
            email,
            paypalId,
        },
    });
};
exports.returnAfterLoginPaypal = returnAfterLoginPaypal;
const authorizationEndpoint = async (req, res) => {
    const user = req.user;
    const { shopId } = user;
    const returnURL = encodeURIComponent(`http://127.0.0.1:3000/return-paypal`);
    const url = `https://www.sandbox.paypal.com/connect?flowEntry=static&client_id=${PAYPAL_API_CLIENT}&scope=openid profile email https://uri.paypal.com/services/paypalattributes&redirect_uri=${returnURL}`;
    return res.status(http_status_codes_1.StatusCodes.OK).json({ url });
};
exports.authorizationEndpoint = authorizationEndpoint;
const chargeCoin = async (req, res) => {
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
    const access_token = await getAccessToken();
    // make a request
    const response = await axios_1.default.post(`${process.env.PAYPAL_API}/v2/checkout/orders`, order, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
    res.json(response.data);
};
exports.chargeCoin = chargeCoin;
const captureOrder = async (req, res) => {
    const { token } = req.query;
    const { userId } = req.user;
    if (!token) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_FORBIDDEN);
    }
    if (!req.query.invoiceId) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    const invoiceId = req.query.invoiceId;
    const invoice = (await Invoice_model_1.default.findById(invoiceId));
    if (!invoice) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
    }
    try {
        const response = await (0, paypal_1.Capture_PayPal)(token);
        const buyerFee = (await (0, system_controller_1.getSystemDocument)()).buyerFee;
        const fee = (invoice.invoiceTotal * buyerFee) / 100;
        const totalAmount = invoice.invoiceTotal + fee;
        //Record user coin
        const transaction = await (0, currencyTransaction_1.userTransaction)(userId, invoiceId, -totalAmount, //minus number
        `Pay for invoice: #${invoiceId}`);
        //Update invoice status
        await (0, invoice_controller_1.paidInvoice)(invoice, transaction._id, userId);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            data: response?.data,
            invoiceId,
        });
    }
    catch (error) {
        console.log(error);
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
    const sellerFee = (await (0, system_controller_1.getSystemDocument)()).sellerFee;
    const updateInvoiceLicensePromises = invoice.productList.map((product, index) => {
        const netAmount = (product.productPrice * (100 - sellerFee)) / 100;
        (0, currencyTransaction_1.shopTransaction)(product.shop, invoiceId, `Payment from ${invoiceId}`, netAmount).catch((err) => {
            console.log(err);
        });
        //Create license for user
        const license = new License_model_1.default({
            userId,
            invoice: invoiceId,
            shop: product.shop,
            product: product.product,
            boughtTime: new Date(),
            licenseFile: "a",
            productPrice: product.productPrice,
        });
        return license
            .save()
            .then((savedLicense) => {
            invoice.productList[index].license = savedLicense._id;
        })
            .catch((error) => {
            console.error(error);
        });
    });
    await Promise.all(updateInvoiceLicensePromises);
    invoice.save().catch((error) => {
        console.error(error);
    });
};
exports.captureOrder = captureOrder;
const paymentHistory = async (req, res) => {
    const { userId } = req.user;
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const total = await UserTransaction_model_1.default.countDocuments({
        userId: userId,
    }).lean();
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    //Get transactions
    const transactions = await UserTransaction_model_1.default.find({
        userId: userId,
    })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        transactions,
    });
};
exports.paymentHistory = paymentHistory;
const createRequestRefund = async (req, res) => {
    const { userId } = req.user;
    const { invoiceId, productId } = req.body;
    if (!invoiceId || !productId) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    //Checking existed
    const refund = await Refund_model_1.default.findOne({
        userId: userId,
        invoiceId: invoiceId,
        productId: productId,
    }).lean();
    if (refund) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_AUTHENTICATION_DUPLICATE);
    }
    //Checking history
    const history = await License_model_1.default.findOne({
        userId: userId,
        invoice: invoiceId,
        product: productId,
    }).lean();
    if (!history) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_REQUEST_REFUND);
    }
    //Checking bought time
    const { boughtTime } = history;
    let diff = Math.abs(boughtTime.getTime() - new Date().getTime());
    let diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    if (diffDays > Constants.acceptRefund) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_EXPIRED_REFUND_TIME);
    }
    //Create refund request
    const request = await Refund_model_1.default.create({
        userId: userId,
        shopId: history.shop,
        ...req.body,
    });
    res.status(http_status_codes_1.StatusCodes.CREATED).json(request);
};
exports.createRequestRefund = createRequestRefund;
//# sourceMappingURL=payment.controller.js.map