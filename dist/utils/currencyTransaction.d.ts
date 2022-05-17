export declare const pointTransaction: (userId: string, changeAmount: number, reason: string) => Promise<any>;
export declare const pointRollBack: (userId: string, transactionId: string, changeAmount: number) => Promise<any>;
export declare const coinTransaction: (userId: string, changeAmount: number, reason: string) => Promise<any>;
export declare const coinRollBack: (userId: string, transactionId: string, changeAmount: number) => Promise<any>;
//# sourceMappingURL=currencyTransaction.d.ts.map