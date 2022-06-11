export declare const CreateOrder_PayPal: (totalAmount: number) => Promise<any>;
export declare const Payout_PayPal: (amountValue: number | string, receiver: string) => Promise<import("axios").AxiosResponse<any, any> | undefined>;
export declare const Capture_PayPal: (token: string) => Promise<{
    transactionPaypalId: any;
    response: import("axios").AxiosResponse<any, any> | undefined;
}>;
export declare const Refund_PayPal: (captureId: string, feeAmount: number, invoiceId: string, note_to_payer: string) => Promise<import("axios").AxiosResponse<any, any> | undefined>;
//# sourceMappingURL=paypal.d.ts.map