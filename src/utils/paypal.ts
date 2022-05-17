import axios from "axios";
import { Invoice, Product } from "../types/object-type";
import { v4 as uuidv4 } from "uuid";

const PAYPAL_API_CLIENT = process.env.PAYPAL_API_CLIENT!;
const PAYPAL_API_SECRET = process.env.PAYPAL_API_SECRET!;
const DOMAIN_NAME = process.env.DOMAIN_NAME!;
const FE_DOMAIN_NAME = process.env.FE_DOMAIN_NAME!;
const PAYPAL_API = process.env.PAYPAL_API!;

let accessToken: string;

const refreshAccessToken = async () => {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");

  const {
    data: { access_token },
  } = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    auth: {
      username: PAYPAL_API_CLIENT,
      password: PAYPAL_API_SECRET,
    },
  });
  return access_token;
};

export const CreateOrder_PayPal = async (
  productList: Product[],
  invoice: Invoice,
  buyerFee: number
) => {
  const items_detail = productList.map((product) => {
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
  const order = {
    intent: "CAPTURE",
    purchase_units: [
      {
        description: "This is your product order",
        amount: {
          currency_code: "USD",
          value: invoice.invoiceTotal,
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: invoice.invoiceTotal,
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
      return_url: `${DOMAIN_NAME}/api/v1/payment/capture-order`,
      cancel_url: `${DOMAIN_NAME}/api/v1/payment/cancel-payment`,
    },
  };

  const createOrderPromise = () => {
    return axios.post(`${process.env.PAYPAL_API}/v2/checkout/orders`, order, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  let response;
  let linkPayPal;
  try {
    response = await createOrderPromise();
    linkPayPal = response.data.links[1].href;
  } catch (error: any) {
    if (error.response.data.error == "invalid_token") {
      accessToken = await refreshAccessToken();
      response = await createOrderPromise();
      
      linkPayPal = response.data.links[1].href;
    } else {
      console.log(error.response.data);
    }
  }

  if(!linkPayPal) {
    throw new Error("Something wrong with paypal");
  }

  return linkPayPal;
};

export const Payout_PayPal = async (
  amountValue: number | string,
  receiver: string
) => {
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

  const payoutPromise = () => {
    return axios.post(
      `${process.env.PAYPAL_API}/v1/payments/payouts`,
      payoutObj,
      {
        auth: {
          username: PAYPAL_API_CLIENT!,
          password: PAYPAL_API_SECRET!,
        },
      }
    );
  };

  let response;
  try {
    response = await payoutPromise();
  } catch (error: any) {
    console.log(error.response.data);
  }

  return response;
};

export const Capture_PayPal = async (token: string) => {
  const capturePromise = () => {
    return axios.post(
      `${process.env.PAYPAL_API}/v2/checkout/orders/${token}/capture`,
      {},
      {
        auth: {
          username: PAYPAL_API_CLIENT,
          password: PAYPAL_API_SECRET,
        },
      }
    );
  };

  let response;
  try {
    response = await capturePromise();
  } catch (error: any) {
    console.log(error.response.data)
  }

  return response;
};
