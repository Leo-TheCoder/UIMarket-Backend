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
exports.refundPayment = exports.testCapturePaypal = exports.testPaypal = exports.refund = exports.createRequestRefund = exports.paymentHistory = exports.captureOrder = exports.chargeCoin = exports.authorizationEndpoint = exports.returnAfterLoginPaypal = exports.withdrawPayment = exports.cancelPayment = exports.createOrder = exports.preOrder = exports.getSellerFee = exports.getBuyerFee = void 0;
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
const enum_1 = require("../types/enum");
const statusInvoice_1 = require("../utils/statusInvoice");
const PAYPAL_API_CLIENT = process.env.PAYPAL_API_CLIENT;
const PAYPAL_API_SECRET = process.env.PAYPAL_API_SECRET;
const DOMAIN_NAME = process.env.DOMAIN_NAME;
const getAccessToken = async () => {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    const { data } = await axios_1.default.post("https://api-m.sandbox.paypal.com/v1/oauth2/token", params, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
            username: PAYPAL_API_CLIENT,
            password: PAYPAL_API_SECRET,
        },
    });
    console.log(data);
    return data.access_token;
};
const getBuyerFee = async (req, res) => {
    const buyerFee = (await (0, system_controller_1.getSystemDocument)()).buyerFee;
    return res.status(http_status_codes_1.StatusCodes.OK).json({ buyerFee });
};
exports.getBuyerFee = getBuyerFee;
const getSellerFee = async (req, res) => {
    const sellerFee = (await (0, system_controller_1.getSystemDocument)()).sellerFee;
    return res.status(http_status_codes_1.StatusCodes.OK).json({ sellerFee });
};
exports.getSellerFee = getSellerFee;
const preOrder = async (req, res) => {
    const { productList, invoiceTotal } = await (0, invoice_controller_1.preOrder)(req.body.productList);
    const buyerFee = (await (0, system_controller_1.getSystemDocument)()).buyerFee;
    res
        .status(http_status_codes_1.StatusCodes.OK)
        .json({ productList, invoiceTotal, buyerFee, isFree: invoiceTotal === 0 });
};
exports.preOrder = preOrder;
const createOrder = async (req, res) => {
    const { userId } = req.user;
    const buyerFee = (await (0, system_controller_1.getSystemDocument)()).buyerFee;
    const invoice = (await (0, invoice_controller_1.createOrder)(userId, req.body.productList, buyerFee));
    const productList = invoice.productList;
    if (invoice.invoiceTotal === 0) {
        const session = await Invoice_model_1.default.startSession();
        try {
            await (0, statusInvoice_1.updateInvoiceAndLicensesAfterPayment_Transaction)(invoice, 0, 0, userId, session);
            invoice.transactionPaypalId = "0";
            await invoice.save({ session });
            await session.commitTransaction();
            await session.endSession();
            return res.status(http_status_codes_1.StatusCodes.OK).json({
                invoiceId: invoice._id,
                invoice: invoice,
                isFree: true,
            });
        }
        catch (error) {
            console.log(error);
            await session.abortTransaction();
            await session.endSession();
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
        }
    }
    try {
        //const response = await CreateOrder_PayPal(productList, invoice, buyerFee);
        const response = await (0, paypal_1.CreateOrder_PayPal)(invoice.invoiceTotal);
        res.json({
            paypal_link: response,
            invoiceId: invoice._id,
            isFree: false,
        });
    }
    catch (error) {
        console.log(error);
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    }
};
exports.createOrder = createOrder;
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
    if (!shop.shopPayPal) {
        throw new unauthenticated_error_1.default(ErrorMessage.ERROR_PAYPAL_INVALID);
    }
    const receiver = shop.shopPayPal;
    try {
        //update coin
        const response = await (0, paypal_1.Payout_PayPal)(amountValue, receiver);
        const transaction = await (0, currencyTransaction_1.shopWithdrawTransaction)(shop, -amountValue //minus value
        ).catch((err) => console.log(err));
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
    const session = await Invoice_model_1.default.startSession();
    const buyerFee = (await (0, system_controller_1.getSystemDocument)()).buyerFee;
    const sellerFee = (await (0, system_controller_1.getSystemDocument)()).sellerFee;
    try {
        await session.withTransaction(async () => {
            await (0, statusInvoice_1.updateInvoiceAndLicensesAfterPayment_Transaction)(invoice, sellerFee, buyerFee, userId, session);
            const { response, transactionPaypalId } = await (0, paypal_1.Capture_PayPal)(token);
            invoice.transactionPaypalId = transactionPaypalId;
            await invoice.save({ session: session });
        });
    }
    catch (error) {
        console.error(error);
    }
    await session.endSession();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        invoiceId,
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
    const { licenseIds, refundReason, refundEvidences, invoiceId } = req.body;
    if (!licenseIds || !refundReason || !refundEvidences || !invoiceId) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    if (licenseIds.length < 1) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    //Checking existed
    const refund = await Refund_model_1.default.findOne({
        invoiceId,
    }).lean();
    if (refund) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_AUTHENTICATION_DUPLICATE);
    }
    //Checking history
    const history = await License_model_1.default.findById(licenseIds[0]).lean();
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
        ...req.body,
    });
    (0, statusInvoice_1.updateInvoiceAndLicensesBeforeRefund)(licenseIds, invoiceId);
    res.status(http_status_codes_1.StatusCodes.CREATED).json(request);
};
exports.createRequestRefund = createRequestRefund;
const refund = async (req, res) => {
    let RefundAction;
    (function (RefundAction) {
        RefundAction["ACCEPT"] = "ACCEPT";
        RefundAction["DENY"] = "DENY";
    })(RefundAction || (RefundAction = {}));
    const refundId = req.body.refundId;
    const action = req.body.action;
    if (!refundId || !action) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    const refundDoc = (await Refund_model_1.default.findById(refundId)
        .populate({
        path: "licenseIds",
        select: "shop product productPrice",
        populate: {
            path: "product",
            select: "productName",
        },
    })
        .populate({ path: "invoiceId", select: "transactionPaypalId" }));
    if (!refundDoc) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_REQUEST_REFUND);
    }
    const transactionPaypalId = refundDoc.invoiceId.transactionPaypalId;
    const licenseIds = refundDoc.licenseIds.map((license) => license._id);
    const productIds = refundDoc.licenseIds.map((license) => license.product._id);
    if (action === RefundAction.ACCEPT) {
        let refundAmount = 0;
        refundDoc.licenseIds.forEach((license) => {
            refundAmount += license.productPrice;
        });
        const buyerFee = (await (0, system_controller_1.getSystemDocument)()).buyerFee;
        refundAmount = (refundAmount * (100 + buyerFee)) / 100;
        refundAmount = Math.round(refundAmount * 100) / 100;
        const response = await (0, paypal_1.Refund_PayPal)(transactionPaypalId, refundAmount, refundDoc.invoiceId._id, `Refund accepted from invoice: ${refundDoc.invoiceId._id}`);
        //Refund failed
        if (response?.data.status != "COMPLETED") {
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
        }
        (0, currencyTransaction_1.refundTransaction)(refundDoc.userId, refundDoc.invoiceId._id, productIds, refundAmount).catch((error) => {
            console.error("Update refund transaction: FAILED!");
            throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
        });
        (0, statusInvoice_1.updateInvoiceAndLicensesAfterRefund)(licenseIds, refundDoc.invoiceId._id);
        refundDoc.refundStatus = enum_1.RefundStatusEnum.RESOLVED;
        await refundDoc.save();
    }
    else {
        (0, statusInvoice_1.updateInvoiceAndLicensesAfterDeclineRefund)(licenseIds, refundDoc.invoiceId._id);
        refundDoc.refundStatus = enum_1.RefundStatusEnum.DECLINED;
        await refundDoc.save();
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        msg: "Refund successfully!",
    });
};
exports.refund = refund;
//=========================TESTING==============================
//==============================================================
//==============================================================
//==============================================================
const testPaypal = async (req, res) => {
    const access_token = await getAccessToken();
    const items_detail = [
        {
            name: "Hello",
            unit_amount: {
                currency_code: "USD",
                value: 10,
            },
            quantity: "1",
            description: "Deex Product",
        },
        {
            name: "Hi",
            unit_amount: {
                currency_code: "USD",
                value: 10,
            },
            quantity: "1",
            description: "Deex Product",
        },
    ];
    const order = {
        intent: "CAPTURE",
        purchase_units: [
            {
                description: "This is your product order",
                amount: {
                    currency_code: "USD",
                    value: 20,
                    breakdown: {
                        item_total: {
                            currency_code: "USD",
                            value: 20,
                        },
                    },
                },
                items: items_detail,
            },
        ],
        application_context: {
            brand_name: "DeeX Market",
            landing_page: "NO_PREFERENCE",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: `http:localhost:5000/api/v1/payment/test/capture`,
            cancel_url: `http:localhost:5000`,
        },
    };
    const { data } = await axios_1.default.post("https://api-m.sandbox.paypal.com/v2/checkout/orders", order, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
    res.json(data);
};
exports.testPaypal = testPaypal;
const testCapturePaypal = async (req, res) => {
    const { token } = req.query;
    const { data } = await axios_1.default.post(`${process.env.PAYPAL_API}/v2/checkout/orders/${token}/capture`, {}, {
        auth: {
            username: PAYPAL_API_CLIENT,
            password: PAYPAL_API_SECRET,
        },
    });
    res.json({ data });
};
exports.testCapturePaypal = testCapturePaypal;
const refundPayment = async (req, res) => {
    const access_token = await getAccessToken();
    const { token } = req.body;
    let response = {};
    try {
        response = await axios_1.default.post(`${process.env.PAYPAL_API}/v2/payments/captures/${token}/refund`, {
            amount: {
                value: 10,
                currency_code: "USD",
            },
            invoice_id: "123",
            note_to_payer: "Hello",
        }, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: `application/json`,
            },
        });
    }
    catch (err) {
        console.log(err);
    }
    res.json(response.data);
};
exports.refundPayment = refundPayment;
//# sourceMappingURL=payment.controller.js.map