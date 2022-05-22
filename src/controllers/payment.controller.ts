//Library
import axios, { AxiosResponse } from "axios";
import { encodeBase64 } from "bcryptjs";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { IUserRequest } from "../types/express";
import { v4 as uuidv4 } from "uuid";
import { Product, Invoice } from "../types/object-type";
import * as Constants from "../constants";

//Model
import ShopModel from "../models/Shop.model";
import ProductModel from "../models/Product.model";
import InvoiceModel from "../models/Invoice.model";

//Error
import UnauthenticatedErorr from "../errors/unauthenticated-error";
import * as ErrorMessage from "../errors/error_message";
import { BadRequestError, InternalServerError } from "../errors";

//Ultis
import {
  createOrder as createInvoice,
  paidInvoice,
} from "./invoice.controller";
import {
  shopTransaction,
  shopWithdrawTransaction,
  userTransaction,
} from "../utils/currencyTransaction";
import {
  Capture_PayPal,
  CreateOrder_PayPal,
  Payout_PayPal,
} from "../utils/paypal";
import { getSystemDocument } from "./admin/system.controller";
import UserTransactionModel from "../models/UserTransaction.model";
import LicenseModel from "../models/License.model";

interface IQuery {
  page?: string;
  limit?: string;
}

const PAYPAL_API_CLIENT = process.env.PAYPAL_API_CLIENT!;
const PAYPAL_API_SECRET = process.env.PAYPAL_API_SECRET!;
const DOMAIN_NAME = process.env.DOMAIN_NAME!;

const getAccessToken = async () => {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");

  const {
    data: { access_token },
  } = await axios.post(
    "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    params,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      auth: {
        username: PAYPAL_API_CLIENT,
        password: PAYPAL_API_SECRET,
      },
    },
  );
  return access_token;
};

export const createOrder = async (req: IUserRequest, res: Response) => {
  const invoice = (await createInvoice(req)) as Invoice;

  const productList = invoice.productList as Array<Product>;
  const buyerFee = (await getSystemDocument()).buyerFee;
  try {
    const response = await CreateOrder_PayPal(productList, invoice, buyerFee);
    res.json({
      paypal_link: response,
      invoiceId: invoice._id,
    });
  } catch (error) {
    console.log(error);
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

//Error
export const refundPayment = async (req: IUserRequest, res: Response) => {
  const { access_token } = await getAccessToken();
  const { token } = req.body;
  let response: any = {};
  try {
    response = await axios.post(
      `${process.env.PAYPAL_API}/v2/payments/captures/${token}/refund`,
      {},
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
  } catch (err) {
    console.log(err);
  }
  res.json(response.data);
};

export const cancelPayment = (req: IUserRequest, res: Response) => {
  res.status(StatusCodes.OK).send("Cancel Payment!");
};

export const withdrawPayment = async (req: IUserRequest, res: Response) => {
  const { amountValue } = req.body;

  //get email or paypal id from db
  const { shopId } = req.user!;
  const shop = await ShopModel.findById(shopId);
  if (!shop) {
    throw new UnauthenticatedErorr(ErrorMessage.ERROR_INVALID_SHOP_ID);
  }
  if (!shop.shopPayPal.paypalEmail) {
    throw new UnauthenticatedErorr(ErrorMessage.ERROR_PAYPAL_INVALID);
  }
  const receiver = shop.shopPayPal.paypalEmail;

  try {
    //update coin
    const response = await Payout_PayPal(amountValue, receiver);
    const transaction = await shopWithdrawTransaction(
      shop,
      `Withdraw from system $${amountValue}`,
      -amountValue, //minus value
    ).catch((err) => console.log(err));

    res.status(StatusCodes.OK).json({
      response: response?.data,
      transaction,
    });
  } catch (error) {
    console.log(error);
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

export const returnAfterLoginPaypal = async (
  req: IUserRequest,
  res: Response,
) => {
  const query = req.query;
  const authorization_base64 = Buffer.from(
    `${PAYPAL_API_CLIENT}:${PAYPAL_API_SECRET}`,
  ).toString("base64");

  //GET ACCESS TOKEN
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", query.code!.toString());
  const response = await axios.post(
    `https://api-m.sandbox.paypal.com/v1/oauth2/token`,
    params,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authorization_base64}`,
      },
    },
  );
  const { access_token } = response.data;

  const profileInfo = await axios.get(
    `https://api-m.sandbox.paypal.com/v1/identity/oauth2/userinfo?schema=paypalv1.1`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    },
  );

  //store paypal info into db
  const { shopId } = req.user!;
  const profile = profileInfo.data;
  const email = profile.emails[0].value;
  const paypalId = profile.payer_id;
  const shop = await ShopModel.findById(shopId, "shopPayPal");
  shop.shopPayPal.paypalEmail = email;
  shop.shopPayPal.paypalId = paypalId;
  await shop.save();

  res.status(StatusCodes.OK).json({
    msg: "Connect paypal to your shop account successfully!",
    paypal_profile: {
      email,
      paypalId,
    },
  });
};

export const authorizationEndpoint = async (
  req: IUserRequest,
  res: Response,
) => {
  const user = req.user;
  const { shopId } = user!;
  const returnURL = encodeURIComponent(`http://127.0.0.1:3000/return-paypal`);
  const url = `https://www.sandbox.paypal.com/connect?flowEntry=static&client_id=${PAYPAL_API_CLIENT}&scope=openid profile email https://uri.paypal.com/services/paypalattributes&redirect_uri=${returnURL}`;
  return res.status(StatusCodes.OK).json({ url });
};

export const chargeCoin = async (req: IUserRequest, res: Response) => {
  const { user } = req;
  const { amountValue } = req.body;

  const order = {
    intent: "CAPTURE",
    purchase_units: [
      {
        description: `Deposit money to your account`,
        amount: {
          currency_code: "USD",
          value: amountValue,
        },
      },
    ],
    application_context: {
      brand_name: "deexmarket.com",
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
      return_url: `${DOMAIN_NAME}/api/v1/payment/capture-order?amount=${amountValue}`,
      cancel_url: `${DOMAIN_NAME}/api/v1/payment/cancel-payment`,
    },
  };

  const access_token = await getAccessToken();

  // make a request
  const response = await axios.post(
    `${process.env.PAYPAL_API}/v2/checkout/orders`,
    order,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    },
  );

  res.json(response.data);
};

export const captureOrder = async (req: IUserRequest, res: Response) => {
  const { token } = req.query as { token: string };
  const { userId } = req.user!;

  if (!token) {
    throw new BadRequestError(ErrorMessage.ERROR_FORBIDDEN);
  }

  if (!req.query.invoiceId) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }
  const invoiceId = req.query.invoiceId as string;

  const invoice = (await InvoiceModel.findById(invoiceId)) as Invoice;
  if (!invoice) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_INVOICE_ID);
  }

  try {
    const response = await Capture_PayPal(token);
    const buyerFee = (await getSystemDocument()).buyerFee;

    const fee = (invoice.invoiceTotal * buyerFee) / 100;
    const totalAmount = invoice.invoiceTotal + fee;
    //Record user coin
    const transaction = await userTransaction(
      userId,
      invoiceId,
      -totalAmount, //minus number
      `Pay for invoice: #${invoiceId}`,
    );
    //Update invoice status
    await paidInvoice(invoice, transaction._id, userId);

    res.status(StatusCodes.OK).json({
      data: response?.data,
      invoiceId,
    });
  } catch (error) {
    console.log(error);
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }

  const sellerFee = (await getSystemDocument()).sellerFee;

  const updateInvoiceLicensePromises = invoice.productList.map(
    (product, index) => {
      const netAmount = (product.productPrice * (100 - sellerFee)) / 100;

      shopTransaction(
        product.shop,
        invoiceId,
        `Payment from ${invoiceId}`,
        netAmount,
      ).catch((err) => {
        console.log(err);
      });
      //Create license for user
      const license = new LicenseModel({
        userId,
        invoice: invoiceId,
        shop: product.shop,
        product: product.product,
        boughtTime: new Date(),
        licenseFile: "a",
        productPrice: product.productPrice,
      });

      return license
        .save()
        .then((savedLicense: any) => {
          invoice.productList[index].license = savedLicense._id;
        })
        .catch((error: any) => {
          console.error(error);
        });
    },
  );

  await Promise.all(updateInvoiceLicensePromises);
  invoice.save().catch((error: any) => {
    console.error(error);
  });
};

export const paymentHistory = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const total = await UserTransactionModel.countDocuments({
    userId: userId,
  }).lean();

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  //Get transactions
  const transactions = await UserTransactionModel.find({
    userId: userId,
  })
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    transactions,
  });
};

// export const paymentHistory = async (req: IUserRequest, res: Response) => {
//   const { userId } = req.user!;
//   const query = req.query as IQuery;
//   const page = parseInt(query.page!) || Constants.defaultPageNumber;
//   const limit = parseInt(query.limit!) || Constants.defaultLimit;

//   const total = await UserTransactionModel.countDocuments({
//     userId: userId,
//   }).lean();

//   const totalPages =
//     total % limit === 0
//       ? Math.floor(total / limit)
//       : Math.floor(total / limit) + 1;

//   //Get transactions
//   const transactions = await UserTransactionModel.find({
//     userId: userId,
//   })
//     .skip((page - 1) * limit)
//     .limit(limit)
//     .sort({ createdAt: -1 })
//     .lean();

//   res.status(StatusCodes.OK).json({
//     totalPages,
//     page,
//     limit,
//     transactions,
//   });
// };
