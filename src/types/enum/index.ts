export enum TransactionStatusEnum {
    COMPLETED = 1,
    PENDING = 0,
    REFUNDED = -1,
};

export enum TransactionActionEnum {
    RECEIVE = "RECEIVE",
    WITHDRAW = "WITHDRAW",
}

export enum RefundStatusEnum {
    PENDING = "Pending",
    RESOLVED = "Resolved",
    DECLINED = "Declined",
}

export enum LicesneStatusEnum {
    ACTIVE = "ACTIVE",
    DEACTIVE = "DEACTIVE",
}