"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearInvoiceModel = void 0;
const constants_1 = require("../constants");
const Invoice_model_1 = __importDefault(require("../models/Invoice.model"));
const clearInvoiceModel = async () => {
    const now = new Date();
    const daysAgo = new Date();
    daysAgo.setDate(now.getDate() - constants_1.invoicePendingPeriod);
    await Invoice_model_1.default.deleteMany({
        invoiceStatus: "Waiting",
        updatedAt: { $lt: daysAgo }
    });
};
exports.clearInvoiceModel = clearInvoiceModel;
(0, exports.clearInvoiceModel)();
//# sourceMappingURL=clearPendingInvoices.js.map