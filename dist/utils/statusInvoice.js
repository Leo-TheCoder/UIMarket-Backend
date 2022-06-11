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
exports.updateInvoiceAndLicensesAfterPayment_Transaction = exports.updateInvoiceAndLicensesAfterDeclineRefund = exports.updateInvoiceAndLicensesAfterRefund = exports.updateInvoiceAndLicensesBeforeRefund = void 0;
const License_model_1 = __importDefault(require("../models/License.model"));
const Invoice_model_1 = __importDefault(require("../models/Invoice.model"));
const enum_1 = require("../types/enum");
const errors_1 = require("../errors");
const ErrorMessage = __importStar(require("../errors/error_message"));
const currencyTransaction_1 = require("./currencyTransaction");
const invoice_controller_1 = require("../controllers/invoice.controller");
const Shop_model_1 = __importDefault(require("../models/Shop.model"));
const ShopTransaction_model_1 = __importDefault(require("../models/ShopTransaction.model"));
const updateInvoiceAndLicensesBeforeRefund = (licenseIds, invoiceId) => {
    License_model_1.default.updateMany({
        _id: { $in: licenseIds },
    }, {
        licenseStatus: enum_1.LicesneStatusEnum.REFUNDING,
    }).catch((error) => {
        console.error("Update licenses status to refunding: FAILED!");
    });
    Invoice_model_1.default.updateOne({
        _id: invoiceId,
    }, {
        isRefunded: true,
    }).catch((error) => {
        console.error("Update refunding invoice status: FAILED!");
    });
};
exports.updateInvoiceAndLicensesBeforeRefund = updateInvoiceAndLicensesBeforeRefund;
const updateInvoiceAndLicensesAfterRefund = (licenseIds, invoiceId) => {
    //license status update
    License_model_1.default.updateMany({
        _id: { $in: licenseIds },
    }, {
        licenseStatus: enum_1.LicesneStatusEnum.DEACTIVE,
    }).catch((error) => {
        console.error("Update refund licenses: FAILED!");
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    });
    //invoice refund status update
    Invoice_model_1.default.updateOne({
        _id: invoiceId,
    }, {
        isRefunded: true,
    }).catch((error) => {
        console.error("Update refund invoice status: FAILED!");
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    });
};
exports.updateInvoiceAndLicensesAfterRefund = updateInvoiceAndLicensesAfterRefund;
const updateInvoiceAndLicensesAfterDeclineRefund = (licenseIds, invoiceId) => {
    License_model_1.default.updateMany({
        _id: { $in: licenseIds },
    }, {
        licenseStatus: enum_1.LicesneStatusEnum.ACTIVE,
    }).catch((error) => {
        console.error("Update non-refund licenses: FAILED!");
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    });
    Invoice_model_1.default.updateOne({
        _id: invoiceId,
    }, {
        isRefunded: false,
    }).catch((error) => {
        console.error("Update non-refund invoice status: FAILED!");
        throw new errors_1.InternalServerError(ErrorMessage.ERROR_FAILED);
    });
};
exports.updateInvoiceAndLicensesAfterDeclineRefund = updateInvoiceAndLicensesAfterDeclineRefund;
// export const updateInvoiceAndLicensesAfterPayment = async (
//   invoice: Invoice,
//   sellerFee: number,
//   buyerFee: number,
//   userId: string,
//   transactionPaypalId: string
// ) => {
//   if (invoice.invoiceTotal > 0) {
//     const fee = (invoice.invoiceTotal * buyerFee) / 100;
//     const totalAmount = invoice.invoiceTotal + fee;
//     //Record user coin
//     const transaction = await userTransaction(
//       userId,
//       invoice._id,
//       -totalAmount, //minus number
//       `Pay for invoice: #${invoice._id}`,
//       TransactionStatusEnum.COMPLETED
//     );
//     //Update invoice status
//     await paidInvoice(invoice, transaction._id, userId, transactionPaypalId);
//   } else {
//     await paidInvoice(invoice, undefined, userId, transactionPaypalId);
//   }
//   const updateInvoiceLicensePromises = invoice.productList.map(
//     (product, index) => {
//       if (invoice.invoiceTotal > 0) {
//         let netAmount = (product.productPrice * (100 - sellerFee)) / 100;
//         netAmount = Math.round(netAmount * 100) / 100;
//         shopTransaction(
//           product.shop,
//           invoice._id,
//           product.product,
//           TransactionActionEnum.RECEIVE,
//           netAmount
//         ).catch((err) => {
//           console.log(err);
//         });
//       }
//       //Create license for user
//       const license = new LicenseModel({
//         userId,
//         invoice: invoice._id,
//         shop: product.shop,
//         product: product.product,
//         boughtTime: new Date(),
//         licenseFile: "a",
//         productPrice: product.productPrice,
//       });
//       return license
//         .save()
//         .then((savedLicense: any) => {
//           invoice.productList[index].license = savedLicense._id;
//         })
//         .catch((error: any) => {
//           console.error(error);
//         });
//     }
//   );
//   await Promise.all(updateInvoiceLicensePromises);
//   invoice.save().catch((error: any) => {
//     console.error(error);
//   });
// };
const updateInvoiceAndLicensesAfterPayment_Transaction = async (invoice, sellerFee, buyerFee, userId, session) => {
    const opt = { session };
    if (invoice.invoiceTotal > 0) {
        const fee = (invoice.invoiceTotal * buyerFee) / 100;
        const totalAmount = invoice.invoiceTotal + fee;
        //Record user coin
        const transaction = await (0, currencyTransaction_1.userTransaction)(userId, invoice._id, -totalAmount, //minus number
        `Pay for invoice: #${invoice._id}`, enum_1.TransactionStatusEnum.COMPLETED, opt);
        //Update invoice status
        await (0, invoice_controller_1.paidInvoice)(invoice, transaction._id, userId, opt);
    }
    else {
        await (0, invoice_controller_1.paidInvoice)(invoice, undefined, userId, opt);
    }
    if (invoice.invoiceTotal > 0) {
        const shops = (await Shop_model_1.default.find({
            _id: { $in: invoice.productList.map((product) => product.shop) },
            shopStatus: 1,
        })
            .session(opt.session)
            .lean()).map((shop) => {
            return {
                _id: shop._id.toString(),
                shopBalance: shop.shopBalance,
            };
        });
        const transactionObjects = (0, currencyTransaction_1.shopTransactionObjects)(invoice, enum_1.TransactionActionEnum.RECEIVE, sellerFee, shops);
        await ShopTransaction_model_1.default.insertMany(transactionObjects, {
            session: opt.session,
        });
    }
    const licenseObjects = invoice.productList.map((product) => {
        return {
            userId,
            invoice: invoice._id,
            shop: product.shop,
            product: product.product,
            boughtTime: new Date(),
            licenseFile: "a",
            productPrice: product.productPrice,
        };
    });
    const licenses = await License_model_1.default.create(licenseObjects, {
        session: opt.session,
    });
    licenses.forEach((license) => {
        const id = license._id;
        const productId = license.product.toString();
        for (let i = 0; i < invoice.productList.length; i++) {
            const product = invoice.productList[i];
            if (product.product == productId) {
                product.license = id;
                break;
            }
        }
    });
    await invoice.save(opt);
};
exports.updateInvoiceAndLicensesAfterPayment_Transaction = updateInvoiceAndLicensesAfterPayment_Transaction;
//# sourceMappingURL=statusInvoice.js.map