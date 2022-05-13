import { Request, Response } from "express";
import * as Constants from "../../constants";
import { StatusCodes } from "http-status-codes";
import UserModel from "../../models/User.model";
import { IUserRequest } from "../../types/express";
import { BadRequestError } from "../../errors";
import * as ErrorMessage from "../../errors/error_message";
interface IQuery {
  page?: string;
  limit?: string;
  sort?: SortTypes;
  filter?: FilterTypes;
}

enum SortTypes {
  OLDEST = "oldest",
  NEWEST = "newest",
}

const sortObjMongoose = (sort?: SortTypes) => {
  switch (sort) {
    case SortTypes.OLDEST:
      return { createdAt: 1 };
    case SortTypes.NEWEST:
      return { createdAt: -1 };
    default:
      return {};
  }
};

enum FilterTypes {
  STATUS_ACTIVE = "status-active",
  STATUS_NOT_VERIFIED = "status-not-verified",
  STATUS_DEACTIVE = "status-deactive",
  SELLER = "seller",
  NON_SELLER = "non-seller",
}

const filterObjMongoose = (filter?: FilterTypes) => {
  switch (filter) {
    case FilterTypes.STATUS_ACTIVE:
      return { customerStatus: 1 };
    case FilterTypes.STATUS_NOT_VERIFIED:
      return { customerStatus: 0 };
    case FilterTypes.STATUS_DEACTIVE:
      return { customerStatus: -1 };
    case FilterTypes.SELLER:
      return { shopId: { $ne: null } };
    case FilterTypes.NON_SELLER:
      return { shopId: null };
    default:
      return {};
  }
};

const projectionUserList = {
  __v: 0,
  authenToken: 0,
  customerPassword: 0,
  customerBio: 0,
  refreshToken: 0,
};

export const getAllUsers = async (req: IUserRequest, res: Response) => {
  const query = req.query as IQuery;
  const page = parseInt(query.page!) || Constants.defaultPageNumber;
  const limit = parseInt(query.limit!) || Constants.defaultLimit;

  const sort = query.sort;
  const sortObj = sortObjMongoose(sort);

  const filter = query.filter;
  const filterObj = filterObjMongoose(filter);

  const total = await UserModel.countDocuments({
    ...filterObj,
  }).lean();

  const totalPages =
    total % limit === 0
      ? Math.floor(total / limit)
      : Math.floor(total / limit) + 1;

  //Get product
  const users = await UserModel.find(
    {
      ...filterObj,
    },
    projectionUserList
  )
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    // .populate({ path: "productCategory", select: ["categoryName"] })
    // .populate({ path: "shopId", select: ["shopName"] })
    .lean();

  return res.status(StatusCodes.OK).json({
    totalPages,
    page,
    limit,
    users,
  });
};

export const deactiveUser = async (req: IUserRequest, res: Response) => {
  const { userId } = req.params;
  const user = await UserModel.findById(userId, {
    customerStatus: 1,
  });

  if (!user) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_USER_ID);
  }

  if (user.customerStatus !== -1) {
    user.customerStatus = -1; //Deactive
    await user.save();
  } else {
    throw new BadRequestError(ErrorMessage.ERROR_ACCOUNT_INACTIVED);
  }

  return res.status(StatusCodes.OK).json({
    user,
  });
};

export const activeUser = async (req: IUserRequest, res: Response) => {
  const { userId } = req.params;
  const user = await UserModel.findById(userId, {
    customerStatus: 1,
  });

  if (!user) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_USER_ID);
  }

  if (user.customerStatus !== 1) {
    user.customerStatus = 1; //Active
    await user.save();
  } else {
    throw new BadRequestError(ErrorMessage.ERROR_ACCOUNT_ACTIVATED);
  }

  return res.status(StatusCodes.OK).json({
    user,
  });
};

export const unverifyUser = async (req: IUserRequest, res: Response) => {
  const { userId } = req.params;
  const user = await UserModel.findById(userId, {
    customerStatus: 1,
  });

  if (!user) {
    throw new BadRequestError(ErrorMessage.ERROR_INVALID_USER_ID);
  }

  if (user.customerStatus !== 0) {
    user.customerStatus = 0; //Unverify account
    await user.save();
  } else {
    throw new BadRequestError(ErrorMessage.ERROR_ACCOUNT_INACTIVED);
  }

  return res.status(StatusCodes.OK).json({
    user,
  });
};