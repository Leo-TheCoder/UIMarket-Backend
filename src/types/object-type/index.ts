export type Product = {
  shop: string;
  product: string;
  productPrice: number;
  productName: string;
  isReview: number;
};

export type Invoice = {
  productList: Array<Product>;
  userId: string;
  invoiceTotal: number;
  invoiceStatus: string;
  _id: string;
};
