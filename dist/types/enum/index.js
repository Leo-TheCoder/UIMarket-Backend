"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicesneStatusEnum = exports.RefundStatusEnum = exports.TransactionActionEnum = exports.TransactionStatusEnum = void 0;
var TransactionStatusEnum;
(function (TransactionStatusEnum) {
    TransactionStatusEnum[TransactionStatusEnum["COMPLETED"] = 1] = "COMPLETED";
    TransactionStatusEnum[TransactionStatusEnum["PENDING"] = 0] = "PENDING";
    TransactionStatusEnum[TransactionStatusEnum["REFUNDED"] = -1] = "REFUNDED";
})(TransactionStatusEnum = exports.TransactionStatusEnum || (exports.TransactionStatusEnum = {}));
;
var TransactionActionEnum;
(function (TransactionActionEnum) {
    TransactionActionEnum["RECEIVE"] = "RECEIVE";
    TransactionActionEnum["WITHDRAW"] = "WITHDRAW";
})(TransactionActionEnum = exports.TransactionActionEnum || (exports.TransactionActionEnum = {}));
var RefundStatusEnum;
(function (RefundStatusEnum) {
    RefundStatusEnum["PENDING"] = "Pending";
    RefundStatusEnum["RESOLVED"] = "Resolved";
    RefundStatusEnum["DECLINED"] = "Declined";
})(RefundStatusEnum = exports.RefundStatusEnum || (exports.RefundStatusEnum = {}));
var LicesneStatusEnum;
(function (LicesneStatusEnum) {
    LicesneStatusEnum["ACTIVE"] = "ACTIVE";
    LicesneStatusEnum["DEACTIVE"] = "DEACTIVE";
    LicesneStatusEnum["REFUNDING"] = "REFUNDING";
})(LicesneStatusEnum = exports.LicesneStatusEnum || (exports.LicesneStatusEnum = {}));
//# sourceMappingURL=index.js.map