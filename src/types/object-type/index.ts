import { TransactionStatusEnum, TransactionActionEnum } from "../enum";

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
  save: (option?: any ) => Promise<any>;
};

export type ShopTransaction = {
  _id: string;
  productId: string;
  action: TransactionActionEnum;
  changeAmount: number;
  transactionStatus: TransactionStatusEnum;
  updatedAt?: Date;
  createdAt?: Date;
}
