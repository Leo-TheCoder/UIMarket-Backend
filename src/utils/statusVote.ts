import VotingModel from "../models/Voting.model";

const getStatusVote = async (userId: String, objectId: String) => {
  let voteStatus = {
    upvote: false,
    downvote: false,
  };

  const vote = await VotingModel
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
    } else {
      voteStatus.upvote = true;
    }
  }

  return voteStatus;
};

export { getStatusVote };
