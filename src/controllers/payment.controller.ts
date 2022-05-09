import axios, { AxiosResponse } from "axios";
import { encodeBase64 } from "bcryptjs";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { IUserRequest } from "../types/express";
import { v4 as uuidv4 } from "uuid";
import ShopModel from "../models/Shop.model";
import UnauthenticatedErorr from "../errors/unauthenticated-error";
import * as ErrorMessage from "../errors/error_message";
import { BadRequestError, InternalServerError } from "../errors";
import ProductModel from "../models/Product.model";

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
    }
  );
  return access_token;
};

export const createOrder = async (req: IUserRequest, res: Response) => {
  const { productList } = req.body;
  let totalPrice = 0;
  const products = [];
  for (let i = 0; i < productList.length; i++) {
    const productId = productList[i].productId;
    const product = await ProductModel.findById(productId, {
      productPrice: 1,
      productName: 1,
    }).lean();

    if (!product) {
      throw new BadRequestError(ErrorMessage.ERROR_INVALID_PRODUCT_ID);
    }

    totalPrice += product.productPrice;
    products.push(product);
  }

  //return res.json({ productList, totalPrice });
  const items_detail = products.map((product) => {
    return {
      name: product.productName,
      unit_amount: {
        currency_code: "USD",
        value: product.productPrice,
      },
      quantity: "1",
      description: "Deex Product",
    };
  });

  try {
    const order = {
      intent: "CAPTURE",
      purchase_units: [
        {
          description: "This is your product order",
          amount: {
            currency_code: "USD",
            value: totalPrice,
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: totalPrice,
              },
            },
          },
          items: items_detail
        },
      ],
      application_context: {
        brand_name: "deexmarket.com",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: `${DOMAIN_NAME}/api/v1/payment/capture-order`,
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
  } catch (error) {
    console.log(error);
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};

export const cancelPayment = (req: IUserRequest, res: Response) => {
  res.status(StatusCodes.OK).send("Cancel Payment!");
};

export const payoutOrder = async (req: IUserRequest, res: Response) => {
  const user = req.user;
  const { amountValue } = req.body;

  //get email or paypal id from db
  const { shopId } = user!;
  const shop = await ShopModel.findById(shopId, "shopPayPal");
  if (!shop) {
    throw new UnauthenticatedErorr(ErrorMessage.ERROR_INVALID_SHOP_ID);
  }
  if (!shop.shopPayPal.paypalEmail) {
    throw new UnauthenticatedErorr(ErrorMessage.ERROR_PAYPAL_INVALID);
  }
  const receiver = shop.shopPayPal.paypalEmail;

  const payoutObj = {
    sender_batch_header: {
      sender_batch_id: uuidv4(),
      email_subject: "You have a payout!",
      email_message: "You have receive a payout! Thanks for using our service!",
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: {
          value: amountValue,
          currency: "USD",
        },
        receiver: receiver,
      },
    ],
  };

  try {
    //const access_token = await getAccessToken();

    const response = await axios.post(
      `${process.env.PAYPAL_API}/v1/payments/payouts`,
      payoutObj,
      {
        auth: {
          username: PAYPAL_API_CLIENT!,
          password: PAYPAL_API_SECRET!,
        },
      }
    );

    //update point

    res.status(StatusCodes.OK).json(response.data);
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
  const { token, amount } = req.query;

  try {
    const response = await axios.post(
      `${process.env.PAYPAL_API}/v2/checkout/orders/${token}/capture`,
      {},
      {
        auth: {
          username: PAYPAL_API_CLIENT,
          password: PAYPAL_API_SECRET,
        },
      }
    );

    //Update point
    //...

    res.status(StatusCodes.OK).json({
      data: response.data,
      amount,
    });
  } catch (error) {
    console.log(error);
    throw new InternalServerError(ErrorMessage.ERROR_FAILED);
  }
};
