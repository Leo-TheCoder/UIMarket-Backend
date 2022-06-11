"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetTransaction = void 0;
const ShopTransaction_model_1 = __importDefault(require("../models/ShopTransaction.model"));
const UserTransaction_model_1 = __importDefault(require("../models/UserTransaction.model"));
const Shop_model_1 = __importDefault(require("../models/Shop.model"));
const Invoice_model_1 = __importDefault(require("../models/Invoice.model"));
const License_model_1 = __importDefault(require("../models/License.model"));
const Review_model_1 = __importDefault(require("../models/Review.model"));
const Refund_model_1 = __importDefault(require("../models/Refund.model"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const resetTransaction = async (req, res) => {
    await ShopTransaction_model_1.default.deleteMany();
    await UserTransaction_model_1.default.deleteMany();
    await Invoice_model_1.default.deleteMany();
    await License_model_1.default.deleteMany();
    await Review_model_1.default.deleteMany();
    await Refund_model_1.default.deleteMany();
    await Product_model_1.default.updateMany(undefined, {
        totalSold: 0,
        totalReview: 0,
        productRating: 0,
    });
    await Shop_model_1.default.updateMany({
        shopBalance: { $gt: 0 },
    }, {
        shopBalance: 0,
    });
    res.json({ msg: "Okela" });
};
exports.resetTransaction = resetTransaction;
//# sourceMappingURL=dev.test.js.map