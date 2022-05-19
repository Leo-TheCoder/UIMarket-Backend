import { Request, Response } from "express";
import * as Constants from "../../constants";
import { StatusCodes } from "http-status-codes";
import SystemModel from "../../models/System.model";
import { IUserRequest } from "../../types/express";
import { BadRequestError } from "../../errors";
import * as ErrorMessage from "../../errors/error_message";

let _systemDocument: any;
export const getSystemDocument = async () => {
  if(_systemDocument) {
    return _systemDocument;
  }
  const systemDocuments = await SystemModel.find();

  if (!systemDocuments || systemDocuments.length < 1) {
    _systemDocument = new SystemModel();
    await _systemDocument.save();
  } else {
    _systemDocument = systemDocuments[0];
  }

  return _systemDocument;
};

export const changeSystemFee = async (req: IUserRequest, res: Response) => {
  const systemDocument = await getSystemDocument();
  const {buyerFee, sellerFee} = req.body;
  
  if(!buyerFee && !sellerFee) {
    throw new BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
  }

  if(buyerFee) {
    systemDocument.buyerFee = buyerFee;
  }

  if(sellerFee) {
    systemDocument.sellerFee = sellerFee;
  }

  await systemDocument.save();

  res.status(StatusCodes.OK).json({ systemDocument });
};
