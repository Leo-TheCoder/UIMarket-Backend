"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveShopPayment = void 0;
const ShopTransaction_model_1 = __importDefault(require("../models/ShopTransaction.model"));
const enum_1 = require("../types/enum");
const system_controller_1 = require("../controllers/admin/system.controller");
const Shop_model_1 = __importDefault(require("../models/Shop.model"));
const resolveShopPayment = async () => {
    console.log("Resolving shop payment ...");
    const _system = await (0, system_controller_1.getSystemDocument)();
    const periodToConfirmPayment = _system.periodToConfirmPayment;
    const now = new Date();
    const daysAgo = new Date();
    daysAgo.setDate(now.getDate() - periodToConfirmPayment);
    const transactions = await ShopTransaction_model_1.default.find({
        transactionStatus: enum_1.TransactionStatusEnum.PENDING,
        updatedAt: { $lt: daysAgo }
    });
    const updateShopBalancePromises = transactions.map(transaction => {
        return Shop_model_1.default.findById(transaction.shopId).then(shop => {
            const currentAmount = shop.shopBalance;
            const balanceAmount = currentAmount + transaction.changeAmount;
            shop.shopBalance = balanceAmount;
            shop.save();
            transaction.transactionStatus = enum_1.TransactionStatusEnum.COMPLETED;
            transaction.save();
        });
    });
    await Promise.all(updateShopBalancePromises);
};
exports.resolveShopPayment = resolveShopPayment;
(0, exports.resolveShopPayment)();
//# sourceMappingURL=commitTransaction.js.map