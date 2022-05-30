"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusVote = void 0;
const Voting_model_1 = __importDefault(require("../models/Voting.model"));
const getStatusVote = async (userId, objectId) => {
    let voteStatus = {
        upvote: false,
        downvote: false,
    };
    const vote = await Voting_model_1.default
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
};
exports.getStatusVote = getStatusVote;
//# sourceMappingURL=statusVote.js.map