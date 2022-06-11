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
exports.getInvoiceById = exports.getShopTransaction = exports.searchPurchaseHistory = exports.purchaseHistory = exports.paidInvoice = exports.createOrder = exports.preOrder = void 0;
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
const preOrder = async (productList) => {
    let invoiceTotal = 0;
    if (!productList) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    //Remove duplicate out of array
    productList = productList.filter((value, index, self) => index === self.findIndex((t) => t._id === value._id));
    //Checking product and get its price
    const productPromises = productList.map((productObj, index) => {
        return validProduct(productObj._id).then((_validProduct) => {
            if (_validProduct.productPrice >= 0) {
                invoiceTotal += _validProduct.productPrice;
                productList[index].shopName = _validProduct.shopId.shopName;
                productList[index].productName = _validProduct.productName;
                productList[index].productPrice = _validProduct.productPrice;
                return {
                    product: productObj._id,
                    productName: _validProduct.productName,
                    shop: productObj.shopId,
                    shopName: _validProduct.shopId.shopName,
                    productPrice: _validProduct.productPrice,
                };
            }
        });
    });
    const list = await Promise.all(productPromises);
    return { productList: list, invoiceTotal };
};
exports.preOrder = preOrder;
const createOrder = async (userId, _productList, buyerFee) => {
    const { productList, invoiceTotal } = await (0, exports.preOrder)(_productList);
    let amountTotal = (invoiceTotal * (100 + buyerFee)) / 100;
    amountTotal = Math.round(amountTotal * 100) / 100;
    //Create invoice
    let invoice = await Invoice_model_1.default.create({
        productList: productList,
        invoiceTotal: amountTotal,
        userId: userId,
    });
    return invoice;
};
exports.createOrder = createOrder;
const paidInvoice = async (invoice, transactionId, userId, opt) => {
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
    await invoice.save(opt);
    if (!invoice) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
    }
    //Increase total sold by 1
    const productIds = invoice.productList.map((product) => product.product);
    await Product_model_1.default.updateMany({
        _id: { $in: productIds },
    }, { $inc: { totalSold: 1 } }, { session: opt.session });
    //Delete in cart
    await Cart_model_1.default.deleteMany({ userId, product: { $in: productIds } }, { session: opt.session });
    return invoice;
};
exports.paidInvoice = paidInvoice;
const purchaseHistory = async (req, res) => {
    const { userId } = req.user;
    // const userId = "62693a28052feac047bce72f";
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const filterObj = {
        userId,
        licenseStatus: enum_1.LicesneStatusEnum.ACTIVE,
    };
    const total = await License_model_1.default.find(filterObj).count();
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    //Get product list
    const licenses = await License_model_1.default.find(filterObj)
        .select("-licenseFile")
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
        path: "product",
        select: "productPictures productFile productName",
    })
        .populate({ path: "shop", select: "shopName" })
        .populate({ path: "invoice", select: "productList isRefunded" });
    const productsToResponse = licenses.map((_license) => {
        const license = _license.toObject();
        const isReview = license.invoice.productList.findIndex((x) => String(x.product) == String(license.product._id));
        const picture = license.product.productPictures[0];
        return {
            ...license,
            invoice: undefined,
            isReview: license.invoice.productList[isReview].isReview,
            invoiceId: license.invoice._id,
            product: {
                ...license.product,
                productPictures: picture,
            },
        };
    });
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
        licenseStatus: enum_1.LicesneStatusEnum.ACTIVE,
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
        .populate({ path: "invoice", select: "productList isRefunded" })
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
var FilterTypes;
(function (FilterTypes) {
    FilterTypes["COMPLETED"] = "completed";
    FilterTypes["PENDING"] = "pending";
    FilterTypes["REFUNDED"] = "refunded";
})(FilterTypes || (FilterTypes = {}));
var SortTypes;
(function (SortTypes) {
    SortTypes["NEWEST"] = "newest";
    SortTypes["OLDEST"] = "oldest";
})(SortTypes || (SortTypes = {}));
const filterObjMongoose = (filter) => {
    switch (filter) {
        case FilterTypes.COMPLETED:
            return { transactionStatus: enum_1.TransactionStatusEnum.COMPLETED };
        case FilterTypes.PENDING:
            return { transactionStatus: enum_1.TransactionStatusEnum.PENDING };
        case FilterTypes.REFUNDED:
            return { transactionStatus: enum_1.TransactionStatusEnum.REFUNDED };
        default:
            return {};
    }
};
const sortObjMongoose = (sort) => {
    switch (sort) {
        case SortTypes.OLDEST:
            return { createdAt: 1 };
        case SortTypes.NEWEST:
            return { createdAt: -1 };
        default:
            return { createdAt: -1 };
    }
};
const getShopTransaction = async (req, res) => {
    const { shopId } = req.user;
    const query = req.query;
    const page = parseInt(query.page) || Constants.defaultPageNumber;
    const limit = parseInt(query.limit) || Constants.defaultLimit;
    const filter = query.filter;
    const filterObj = filterObjMongoose(filter);
    const sort = query.sort;
    const sortObj = sortObjMongoose(sort);
    const filterObject = {
        shopId,
        ...filterObj,
    };
    const projectionObject = {
        _id: 1,
        productId: 1,
        action: 1,
        changeAmount: 1,
        transactionStatus: 1,
        updatedAt: 1,
        createdAt: 1,
    };
    const total = await ShopTransaction_model_1.default.count(filterObject);
    const totalPages = total % limit === 0
        ? Math.floor(total / limit)
        : Math.floor(total / limit) + 1;
    const transactions = (await ShopTransaction_model_1.default.find(filterObject)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .select(projectionObject)
        .lean());
    const transactionsToSend = transactions.map((transaction) => {
        let status;
        switch (transaction.transactionStatus) {
            case enum_1.TransactionStatusEnum.COMPLETED:
                status = "COMPLETED";
                break;
            case enum_1.TransactionStatusEnum.PENDING:
                status = "PENDING";
                break;
            case enum_1.TransactionStatusEnum.REFUNDED:
                status = "REFUNDED";
                break;
            default:
                status = "COMPLETED";
                break;
        }
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
const getInvoiceById = async (req, res) => {
    const { invoiceId } = req.params;
    const { userId } = req.user;
    const invoice = await Invoice_model_1.default.findById(invoiceId)
        .populate({
        path: "productList.product",
        select: "productPictures",
    })
        .lean();
    if (!invoice || invoice.userId != userId) {
        throw new errors_1.NotFoundError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
    }
    const productList = invoice.productList.map((_product) => {
        const coverPicture = _product.product.productPictures[0];
        const modifyProduct = JSON.parse(JSON.stringify(_product));
        modifyProduct.coverPicture = coverPicture;
        modifyProduct.product = _product.product._id;
        return modifyProduct;
    });
    invoice.productList = productList;
    res.status(http_status_codes_1.StatusCodes.OK).json({ invoice });
};
exports.getInvoiceById = getInvoiceById;
//# sourceMappingURL=invoice.controller.js.map