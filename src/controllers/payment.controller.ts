import axios from "axios";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { IUserRequest } from "../types/express";

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
        return_url: `${process.env.DOMAIN_NAME}/api/v1/payment/capture-order`,
        cancel_url: `${process.env.DOMAIN_NAME}/api/v1/payment/cancel-payment`,
      },
    };

    //format body
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
          username: process.env.PAYPAL_API_CLIENT!,
          password: process.env.PAYPAL_API_SECRET!,
        },
      }
    );

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
          username: process.env.PAYPAL_API_CLIENT!,
          password: process.env.PAYPAL_API_SECRET!,
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
