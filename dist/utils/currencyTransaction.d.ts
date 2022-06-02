export declare const pointTransaction: (userId: string, changeAmount: number, reason: string) => Promise<any>;
export declare const pointRollBack: (userId: string, transactionId: string, changeAmount: number) => Promise<any>;
export declare const userTransaction: (userId: string, invoiceId: string, changeAmount: number, reason: string) => Promise<any>;
export declare const shopTransaction: (shopId: string, invoiceId: string | null, reason: string, changeAmount: number) => Promise<any>;
export declare const shopWithdrawTransaction: (shopFullDocument: any, reason: string, changeAmount: number) => Promise<any>;
//# sourceMappingURL=currencyTransaction.d.ts.map