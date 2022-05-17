"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLimitComments = exports.upvoteAward = exports.bestAnswerAward = exports.maxBounty = exports.minBounty = exports.maxBountyDueDate = exports.minBountyDueDate = exports.defaultMinLength = exports.defaultPageNumber = exports.defaultLimit = void 0;
//Pagination
const defaultLimit = 10;
exports.defaultLimit = defaultLimit;
const defaultPageNumber = 1;
exports.defaultPageNumber = defaultPageNumber;
//Model
const defaultMinLength = 20;
exports.defaultMinLength = defaultMinLength;
const defaultLimitComments = 5;
exports.defaultLimitComments = defaultLimitComments;
//Bounty constant
const minBountyDueDate = 1;
exports.minBountyDueDate = minBountyDueDate;
const maxBountyDueDate = 30;
exports.maxBountyDueDate = maxBountyDueDate;
const minBounty = 150;
exports.minBounty = minBounty;
const maxBounty = 5000;
exports.maxBounty = maxBounty;
//Question
const bestAnswerAward = 10;
exports.bestAnswerAward = bestAnswerAward;
const upvoteAward = 2;
exports.upvoteAward = upvoteAward;
//# sourceMappingURL=constants.js.map