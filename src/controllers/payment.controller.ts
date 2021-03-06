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
import RefundModel from "../models/Refund.model";
import UserTransactionModel from "../models/UserTransaction.model";
import LicenseModel from "../models/License.model";

//Error
import UnauthenticatedErorr from "../errors/unauthenticated-error";
import * as ErrorMessage from "../errors/error_message";
import {
  BadRequestError,
  CustomError,
  InternalServerError,
  NotFoundError,
} from "../errors";

//Ultis
import {
  createOrder as createInvoice,
  paidInvoice,
  preOrder as checkOrder,
} from "./invoice.controller";
import {
  shopTransaction,
  shopWithdrawTransaction,
  userTransaction,
  refundTransaction,
} from "../utils/currencyTransaction";
import {
  Capture_PayPal,
  CreateOrder_PayPal,
  Payout_PayPal,
  Refund_PayPal,
} from "../utils/paypal";
import { getSystemDocument } from "./admin/system.controller";
import {
  LicesneStatusEnum,
  RefundStatusEnum,
  TransactionActionEnum,
  TransactionStatusEnum,
} from "../types/enum";
import ShopTransactionModel from "../models/ShopTransaction.model";
import {
  updateInvoiceAndLicensesAfterDeclineRefund,
  updateInvoiceAndLicensesAfterRefund,
  updateInvoiceAndLicensesBeforeRefund,
  updateInvoiceAndLicensesAfterPayment_Transaction,
} from "../utils/statusInvoice";

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

  const { data } = await axios.post(
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
    }
  );
  console.log(data);
  return data.access_token;
};

export const getBuyerFee = async (req: IUserRequest, res: Response) => {
  const buyerFee = (await getSystemDocument()).buyerFee;
  return res.status(StatusCodes.OK).json({ buyerFee });
};

export const getSellerFee = async (req: IUserRequest, res: Response) => {
  const sellerFee = (await getSystemDocument()).sellerFee;
  return res.status(StatusCodes.OK).json({ sellerFee });
};

export const preOrder = async (req: IUserRequest, res: Response) => {
  const { productList, invoiceTotal } = await checkOrder(req.body.productList);
  const buyerFee = (await getSystemDocument()).buyerFee;

  res
    .status(StatusCodes.OK)
    .json({ productList, invoiceTotal, buyerFee, isFree: invoiceTotal === 0 });
};

export const createOrder = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const buyerFee = (await getSystemDocument()).buyerFee;
  const invoice = (await createInvoice(
    userId,
    req.body.productList,
    buyerFee,
  )) as Invoice;
  const productList = invoice.productList as Array<Product>;

  if (invoice.invoiceTotal === 0) {
    const session = await InvoiceModel.startSession();

    await session.withTransaction(async () => {
      await updateInvoiceAndLicensesAfterPayment_Transaction(
        invoice,
        0,
        0,
        userId,
        session
      );
      invoice.transactionPaypalId = "0";
      await invoice.save({ session });
    })
    
    return res.status(StatusCodes.OK).json({
      invoiceId: invoice._id,
      invoice: invoice,
      isFree: true,
    });
  }
  
  try {
    //const response = await CreateOrder_PayPal(productList, invoice, buyerFee);
    const response = await CreateOrder_PayPal(invoice.invoiceTotal);
    res.json({
      paypal_link: response,
      invoiceId: invoice._id,
      isFree: false,
    });
  } catch (error) {
    console.log(error);
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
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
  if (!shop.shopEmail) {
    throw new UnauthenticatedErorr(ErrorMessage.ERROR_PAYPAL_INVALID);
  }
  const receiver = shop.shopEmail;

  try {
    //update coin
    const response = await Payout_PayPal(amountValue, receiver);
    const transaction = await shopWithdrawTransaction(
      shop,
      -amountValue //minus value
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
  res: Response
) => {
  const query = req.query;
  const authorization_base64 = Buffer.from(
    `${PAYPAL_API_CLIENT}:${PAYPAL_API_SECRET}`
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
    }
  );
  const { access_token } = response.data;

  const profileInfo = await axios.get(
    `https://api-m.sandbox.paypal.com/v1/identity/oauth2/userinfo?schema=paypalv1.1`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    }
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
  res: Response
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
    }
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

  const session = await InvoiceModel.startSession();
  const buyerFee = (await getSystemDocument()).buyerFee;
  const sellerFee = (await getSystemDocument()).sellerFee;
  try {
    await session.withTransaction(async() => {
      await updateInvoiceAndLicensesAfterPayment_Transaction(
        invoice,
        sellerFee,
        buyerFee,
        userId,
        session
      );
      const { response, transactionPaypalId } = await Capture_PayPal(token);
      invoice.transactionPaypalId = transactionPaypalId;
      await invoice.save({ session: session });
  
    })
  } catch (error) {
    console.error(error);
  }
  

  await session.endSession();

  res.status(StatusCodes.OK).json({
    invoiceId,
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

export const createRequestRefund = async (req: IUserRequest, res: Response) => {
  const { userId } = req.user!;
  const { licenseIds, refundReason, refundEvidences, invoiceId } = req.body;
  if (!licenseIds || !refundReason || !refundEvidences || !invoiceId) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  if (licenseIds.length < 1) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  //Checking existed
  const refund = await RefundModel.findOne({
    invoiceId,
    refundStatus: {
      $in: [RefundStatusEnum.PENDING, RefundStatusEnum.RESOLVED],
    },
  }).lean();
  if (refund) {
    throw new BadRequestError(ErrorMessage.ERROR_AUTHENTICATION_DUPLICATE);
  }

  //Checking if it free
  const licenses = (await LicenseModel.find(
    {
      _id: { $in: licenseIds },
    },
    {
      boughtTime: 1,
      productPrice: 1,
    }
  ).lean()) as {
    boughtTime: Date;
    productPrice: number;
  }[];

  //calculate refund amount
  let refundAmount: number = 0;
  licenses.forEach((license) => {
    refundAmount += license.productPrice;
  });

  if (refundAmount === 0) {
    throw new BadRequestError(ErrorMessage.ERROR_FREE_REFUND);
  }

  const buyerFee = (await getSystemDocument()).buyerFee;
  refundAmount = (refundAmount * (100 + buyerFee)) / 100;
  refundAmount = Math.round(refundAmount * 100) / 100;

  //Checking history
  const history = licenses[0];
  if (!history) {
    throw new NotFoundError(ErrorMessage.ERROR_INVALID_REQUEST_REFUND);
  }

  //Checking bought time
  const { boughtTime } = history;
  let diff = Math.abs(boughtTime.getTime() - new Date().getTime());
  let diffDays = Math.ceil(diff / (1000 * 3600 * 24));

  if (diffDays > Constants.acceptRefund) {
    throw new BadRequestError(ErrorMessage.ERROR_EXPIRED_REFUND_TIME);
  }

  //Create refund request
  const request = await RefundModel.create({
    userId: userId,
    refundAmount: refundAmount,
    ...req.body,
  });
  updateInvoiceAndLicensesBeforeRefund(licenseIds, invoiceId);

  res.status(StatusCodes.CREATED).json(request);
};

//=========================TESTING==============================
//==============================================================
//==============================================================
//==============================================================
export const testPaypal = async (req: IUserRequest, res: Response) => {
  const access_token = await getAccessToken();

  const items_detail = [
    {
      name: "Hello",
      unit_amount: {
        currency_code: "USD",
        value: 10,
      },
      quantity: "1",
      description: "Deex Product",
    },
    {
      name: "Hi",
      unit_amount: {
        currency_code: "USD",
        value: 10,
      },
      quantity: "1",
      description: "Deex Product",
    },
  ];

  const order = {
    intent: "CAPTURE",
    purchase_units: [
      {
        description: "This is your product order",
        amount: {
          currency_code: "USD",
          value: 20,
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: 20,
            },
          },
        },
        items: items_detail,
      },
    ],
    application_context: {
      brand_name: "DeeX Market",
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
      shipping_preference: "NO_SHIPPING",
      return_url: `http:localhost:5000/api/v1/payment/test/capture`,
      cancel_url: `http:localhost:5000`,
    },
  };

  const { data } = await axios.post(
    "https://api-m.sandbox.paypal.com/v2/checkout/orders",
    order,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  res.json(data);
};

export const testCapturePaypal = async (req: IUserRequest, res: Response) => {
  const { token } = req.query;
  const { data } = await axios.post(
    `${process.env.PAYPAL_API}/v2/checkout/orders/${token}/capture`,
    {},
    {
      auth: {
        username: PAYPAL_API_CLIENT,
        password: PAYPAL_API_SECRET,
      },
    }
  );

  res.json({ data });
};

export const refundPayment = async (req: IUserRequest, res: Response) => {
  const access_token = await getAccessToken();
  const { token } = req.body;
  let response: any = {};
  try {
    response = await axios.post(
      `${process.env.PAYPAL_API}/v2/payments/captures/${token}/refund`,
      {
        amount: {
          value: 10,
          currency_code: "USD",
        },
        invoice_id: "123",
        note_to_payer: "Hello",
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: `application/json`,
        },
      }
    );
  } catch (err) {
    console.log(err);
  }
  res.json(response.data);
};
