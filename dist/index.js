"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//Setup enviroment
require("dotenv/config");
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const connect_1 = __importDefault(require("./db/connect"));
const node_cron_1 = __importDefault(require("node-cron"));
//Create server app instance
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
//Router
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const question_route_1 = __importDefault(require("./routes/question.route"));
const questionTag_route_1 = __importDefault(require("./routes/questionTag.route"));
const voting_route_1 = __importDefault(require("./routes/voting.route"));
const answer_route_1 = __importDefault(require("./routes/answer.route"));
const comment_route_1 = __importDefault(require("./routes/comment.route"));
const profile_route_1 = __importDefault(require("./routes/profile.route"));
const shop_route_1 = __importDefault(require("./routes/shop.route"));
const admin_route_1 = __importDefault(require("./routes/admin.route"));
const product_route_1 = __importDefault(require("./routes/product.route"));
const file_route_1 = __importDefault(require("./routes/file.route"));
const verify_route_1 = __importDefault(require("./routes/verify.route"));
const payment_route_1 = __importDefault(require("./routes/payment.route"));
const productCategory_route_1 = __importDefault(require("./routes/productCategory.route"));
const token_route_1 = __importDefault(require("./routes/token.route"));
const invoice_route_1 = __importDefault(require("./routes/invoice.route"));
const review_route_1 = __importDefault(require("./routes/review.route"));
const license_route_1 = __importDefault(require("./routes/license.route"));
const cart_route_1 = __importDefault(require("./routes/cart.route"));
const report_route_1 = __importDefault(require("./routes/report.route"));
//Middleware
const handle_errors_1 = __importDefault(require("./middlewares/handle-errors"));
const not_found_1 = __importDefault(require("./middlewares/not-found"));
const authentication_1 = require("./middlewares/authentication");
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Hello this is DEEX BACKEND");
});
app.use("/api/v1/auth", auth_route_1.default);
app.use("/api/v1/questions", question_route_1.default);
app.use("/api/v1/questionTags", questionTag_route_1.default);
app.use("/api/v1/voting", authentication_1.compulsoryAuth, voting_route_1.default);
app.use("/api/v1/answers", answer_route_1.default);
app.use("/api/v1/comments", comment_route_1.default);
app.use("/api/v1/profile", profile_route_1.default);
app.use("/api/v1/file", authentication_1.compulsoryAuth, file_route_1.default);
app.use("/api/v1/shop", shop_route_1.default);
app.use("/api/v1/admin", admin_route_1.default);
app.use("/api/v1/products", authentication_1.optionalAuth, product_route_1.default);
app.use("/api/v1/verify", verify_route_1.default);
app.use("/api/v1/payment", payment_route_1.default);
app.use("/api/v1/category", productCategory_route_1.default);
app.use("/api/v1/token", token_route_1.default);
app.use("/api/v1/invoices", authentication_1.compulsoryAuth, invoice_route_1.default);
app.use("/api/v1/reviews", review_route_1.default);
app.use("/api/v1/licenses", license_route_1.default);
app.use("/api/v1/carts", authentication_1.compulsoryAuth, cart_route_1.default);
app.use("/api/v1/reports", authentication_1.compulsoryAuth, report_route_1.default);
//tool
const dev_test_1 = require("./controllers/dev.test");
app.get("/resetTransaction", dev_test_1.resetTransaction);
app.use(not_found_1.default);
app.use(handle_errors_1.default);
//Scheduled Task
const resolveBounty_1 = require("./scheduled/resolveBounty");
const commitTransaction_1 = require("./scheduled/commitTransaction");
const clearPendingInvoices_1 = require("./scheduled/clearPendingInvoices");
const start = async () => {
    try {
        await (0, connect_1.default)(process.env.MONGO_URI);
        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}...`);
        });
        //Scheduled Tasks
        //Resolve bounty run everyday at every hour
        node_cron_1.default.schedule("1 * * * *", async () => {
            await (0, resolveBounty_1.resolveBounty)();
        });
        //Resolve shop payment run everyday at 00:01
        node_cron_1.default.schedule("1 0 * * *", async () => {
            await (0, commitTransaction_1.resolveShopPayment)();
        });
        node_cron_1.default.schedule("1 0 * * *", async () => {
            await (0, clearPendingInvoices_1.clearInvoiceModel)();
        });
    }
    catch (error) {
        console.log(error);
    }
};
start();
//# sourceMappingURL=index.js.map