import { TransactionStatus } from "../enum";

export type Product = {
  shop: string;
  product: string;
  productPrice: number;
  productName: string;
  isReview: number;
  license?: string;
};

export type Invoice = {
  productList: Array<Product>;
  userId: string;
  invoiceTotal: number;
  invoiceStatus: string;
  _id: string;
  save: () => Promise<any>;
};

export type ShopTransaction = {
  _id: string;
  reason: string;
  changeAmount: number;
  transactionStatus: TransactionStatus;
}