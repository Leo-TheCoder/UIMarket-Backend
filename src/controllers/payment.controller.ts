import axios, { AxiosResponse } from "axios";
import { encodeBase64 } from "bcryptjs";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { IUserRequest } from "../types/express";

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
  try {
    const order = {
      intent: "CAPTURE",
      purchase_units: [
        {
          description: "This is product order",
          amount: {
            currency_code: "USD",
            value: "100.00",
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: "100.00",
              },
            },
          },
          items: [
            {
              name: "Website Marketplace Templete by LeoTheCoder",
              unit_amount: {
                currency_code: "USD",
                value: "100.00",
              },
              quantity: "1",
              description: "Website Template",
            },
          ],
        },
      ],
      application_context: {
        brand_name: "deexmarket.com",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
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
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Something gone wrong!");
  }
};

export const captureOrder = async (req: IUserRequest, res: Response) => {
  const { token } = req.query;

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

    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Something gone wrong!");
  }
};

export const cancelPayment = (req: IUserRequest, res: Response) => {
  res.status(StatusCodes.OK).send("Cancel Payment!");
};

export const payoutOrder = async (req: IUserRequest, res: Response) => {
  const payoutObj = {
    sender_batch_header: {
      sender_batch_id: "Payouts_16052006_00028091_02",
      email_subject: "You have a payout!",
      email_message: "You have receive a payout! Thanks for using our service!",
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: {
          value: "100.00",
          currency: "USD",
        },
        receiver: "rongbac9@gmail.com",
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

    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Something gone wrong!");
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

  res.status(StatusCodes.OK).json({
    returnUrl: {
      message: "Return URL work!",
      ...query,
    },
    access_token,
    profile: profileInfo.data,
  });
};

export const authorizationEndpoint = async (
  req: IUserRequest,
  res: Response
) => {
  const returnURL = encodeURIComponent(
    `http://127.0.0.1:5000/api/v1/payment/after-login`
  );
  const url = `https://www.sandbox.paypal.com/connect?flowEntry=static&client_id=${PAYPAL_API_CLIENT}&scope=openid profile email https://uri.paypal.com/services/paypalattributes&redirect_uri=${returnURL}`;
  return res.status(StatusCodes.OK).json({ url });
};
