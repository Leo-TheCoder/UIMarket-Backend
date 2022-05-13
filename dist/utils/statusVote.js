"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusVote = void 0;
const Voting_model_1 = __importDefault(require("../models/Voting.model"));
const getStatusVote = (userId, objectId) => __awaiter(void 0, void 0, void 0, function* () {
    let voteStatus = {
        upvote: false,
        downvote: false,
    };
    const vote = yield Voting_model_1.default
        //
        .find({
        objectId: objectId,
        userId: userId,
    })
        .select({
        _id: 0,
        action: 1,
    });
    if (vote.length != 0) {
        if (vote[0].action === 0) {
            voteStatus.downvote = true;
        }
        else {
            voteStatus.upvote = true;
        }
    }
    return voteStatus;
});
exports.getStatusVote = getStatusVote;
//# sourceMappingURL=statusVote.js.map