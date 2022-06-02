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
exports.getShopTransaction = exports.searchPurchaseHistory = exports.purchaseHistory = exports.paidInvoice = exports.createOrder = exports.preOrder = void 0;
//Library
const http_status_codes_1 = require("http-status-codes");
const Constants = __importStar(require("../constants"));
const enum_1 = require("../types/enum");
//Model
const Product_model_1 = __importDefault(require("../models/Product.model"));
const Invoice_model_1 = __importDefault(require("../models/Invoice.model"));
const Cart_model_1 = __importDefault(require("../models/Cart.model"));
const License_model_1 = __importDefault(require("../models/License.model"));
//Error
const errors_1 = require("../errors");
const ErrorMessage = __importStar(require("../errors/error_message"));
const ShopTransaction_model_1 = __importDefault(require("../models/ShopTransaction.model"));
//Checking product is valid or not
const validProduct = async (productId) => {
    let product = await Product_model_1.default.findOne({
        _id: productId,
        // shopId: shopId,
        productStatus: 1,
    })
        .populate({ path: "shopId", select: "shopName" })
        .select("productPrice productName")
        .lean();
    if (product) {
        return product;
    }
    else {
        return -1;
    }
};
const preOrder = async (req) => {
    let productList = req.body.productList;
    let invoiceTotal = 0;
    if (!productList) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    //Remove duplicate out of array
    productList = productList.filter((value, index, self) => index === self.findIndex((t) => t.product === value.product));
    //Checking product and get its price
    const productPromises = productList.map((productObj, index) => {
        return validProduct(productObj.product).then((_validProduct) => {
            if (_validProduct.productPrice >= 0) {
                invoiceTotal += _validProduct.productPrice;
                productList[index].shopName = _validProduct.shopId.shopName;
                productList[index].productName = _validProduct.productName;
                productList[index].productPrice = _validProduct.productPrice;
            }
        });
    });
    await Promise.all(productPromises);
    return { productList, invoiceTotal };
};
exports.preOrder = preOrder;
const createOrder = async (req) => {
    const { userId } = req.user;
    const body = await (0, exports.preOrder)(req);
    const { productList } = body;
    //Create invoice
    let invoice = await Invoice_model_1.default.create({
        productList: productList,
        invoiceTotal: body.invoiceTotal,
        userId: userId,
    });
    return invoice;
};
exports.createOrder = createOrder;
const paidInvoice = async (invoice, transactionId, userId) => {
    //Checking if has transaction Id
    //Checking invoice
    // const invoice = await InvoiceModel.findByIdAndUpdate(
    //   invoiceId,
    //   {
    //     transactionId: transactionId,
    //     invoiceStatus: "Paid",
    //   },
    //   { new: true }
    // ).lean();
    invoice.transactionId = transactionId;
    invoice.invoiceStatus = "Paid";
    await invoice.save();
    if (!invoice) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
    }
    //Increase total sold by 1
    invoice.productList.forEach((product) => {
        Product_model_1.default.updateOne({ _id: product.product }, { $inc: { totalSold: 1 } }).catch((error) => {
            console.log(error);
        });
        Cart_model_1.default.findOneAndRemove({
            userId,
            product: product.product,
        }).catch((error) => {
            console.log(error);
        });
    });
    return invoice;
};
exports.paidInvoice = paidInvoice;
const purchaseHistory = async (req, res) => {
    const { userId } = req.user;
    // const userId = "62693a28052feac047bce72f";
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const total = await License_model_1.default.find({
        userId: userId,
    }).count();
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    //Get product list
    const licenses = await License_model_1.default.find({ userId: userId })
        .select("-licenseFile")
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
        path: "product",
        select: "productPictures productFile productName",
    })
        .populate({ path: "shop", select: "shopName" })
        .populate({ path: "invoice", select: "productList" });
    let productsToResponse = [];
    for (let i = 0; i < licenses.length; i++) {
        let license = licenses[i]._doc;
        let isReview = license.invoice.productList.findIndex((x) => String(x.product) == String(license.product._id));
        license.product.productPictures = license.product.productPictures[0];
        license.isReview = license.invoice.productList[isReview].isReview;
        license.invoiceId = license.invoice._id;
        delete license.invoice;
        productsToResponse.push(license);
    }
    // const products = [];
    // for (let i = 0; i < invoices.length; i++) {
    //   const productList = invoices[i].productList;
    //   for (let j = 0; j < productList.length; j++) {
    //     products.push(productList[j]);
    //   }
    // }
    // const productsToResponse = products.map((product) => {
    //   const productPictureList = product.product.productPictures;
    //   const coverPicture =
    //     productPictureList && productPictureList.length > 0
    //       ? productPictureList[0]
    //       : undefined;
    //   return {
    //     productId: product.product._id,
    //     productFile: product.product.productFile,
    //     coverPicture,
    //     shop: product.shop,
    //     productName: product.productName,
    //     productPrice: product.productPrice,
    //     isReview: product.isReview,
    //     license: product.license,
    //   };
    // });
    // console.log(licenses[0]);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        products: productsToResponse,
    });
};
exports.purchaseHistory = purchaseHistory;
const searchPurchaseHistory = async (req, res) => {
    const { userId } = req.user;
    // const userId = "62693a28052feac047bce72f";
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const projectionObject = {
        licenseFile: 0,
    };
    const searchedProductIds = await Product_model_1.default.aggregate([
        {
            $search: {
                index: "productName",
                text: {
                    path: "productName",
                    query: decodeURIComponent(req.params.productName),
                },
            },
        },
        {
            $project: { _id: 1 },
        },
    ]);
    const productIds = searchedProductIds.map((product) => product._id);
    const filterObject = {
        userId,
        product: { $in: productIds },
    };
    const total = await License_model_1.default.count(filterObject);
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    const purchaseList = await License_model_1.default.find(filterObject)
        .skip((page - 1) * limit)
        .limit(limit)
        .select(projectionObject)
        .populate({
        path: "product",
        select: "productPictures productFile productName",
    })
        .populate({ path: "shop", select: "shopName" })
        .populate({ path: "invoice", select: "productList" })
        .lean();
    const productsToSend = purchaseList.map((license) => {
        const productReviewIndex = license.invoice.productList.findIndex((x) => String(x.product) == String(license.product._id));
        const resObj = {
            ...JSON.parse(JSON.stringify(license)),
            isReview: license.invoice.productList[productReviewIndex].isReview,
            invoiceId: license.invoice._id,
        };
        const pictures = license.product.productPictures;
        resObj.product.productPictures = pictures ? pictures[0] : undefined;
        delete resObj.invoice;
        return resObj;
    });
    return res
        .status(http_status_codes_1.StatusCodes.OK)
        .json({ totalPages, page, limit, products: productsToSend });
};
exports.searchPurchaseHistory = searchPurchaseHistory;
const getShopTransaction = async (req, res) => {
    const { shopId } = req.user;
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const filterObject = {
        shopId,
    };
    const projectionObject = {
        _id: 1,
        reason: 1,
        changeAmount: 1,
        transactionStatus: 1,
    };
    const total = await ShopTransaction_model_1.default.count(filterObject);
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    const transactions = (await ShopTransaction_model_1.default.find(filterObject)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(projectionObject)
        .lean());
    const transactionsToSend = transactions.map((transaction) => {
        const status = transaction.transactionStatus === enum_1.TransactionStatus.COMPLETED
            ? "COMPLETED"
            : "PENDING";
        return {
            ...transaction,
            transactionStatus: status,
        };
    });
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        totalPages,
        page,
        limit,
        transactions: transactionsToSend,
    });
};
exports.getShopTransaction = getShopTransaction;
//# sourceMappingURL=invoice.controller.js.map