import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    const userId = req.user._id

    if( !userId ){
        throw new ApiError(400, "userId is missing")
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId")
    }

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        owner: userId,
        content
    })

    return res
    .status(200)
    .json(new ApiResponse(201, tweet, "Tweet uploaded successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params

    if( !userId ){
        throw new ApiError(400, "userId is missing")
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId")
    }
const tweets = await Tweet.aggregate([
    {
        $match: {
            owner: new mongoose.Types.ObjectId(userId)
        }
    },
    {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails",
            pipeline: [
                {
                    $project: {
                        fullName: 1,
                        username: 1,
                        avatar: 1
                    }
                }
            ]
        }
    },
    {
        $addFields: {
            owner: { $first: "$ownerDetails" }
        }
    },
    {
        $project: {
            content: 1,
            createdAt: 1,
            owner: 1,
            updatedAt: 1
        }
    },
    {
        $sort: { createdAt: -1 }
    }
])

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "All User Tweets Fetched Successfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { content } = req.body
    const { tweetId } = req.params
    const userId = req.user._id

    if( !userId ){
        throw new ApiError(400, "userId is missing")
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId")
    }

    if( !tweetId ){
        throw new ApiError(400, "tweetId is missing")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweetId")
    }

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    // 🔥 Authorization check
    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized")
    }

    tweet.content = content
    await tweet.save()
    // const updatedTweet = await Tweet.findOneAndUpdate(
    //     { _id: tweetId },
    //     { $set: {content} },
    //     { new: true }
    // ).select("owner content updatedAt")

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    const userId = req.user._id

    if(!userId){
        throw new ApiError(400, "userId is missing")
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId")
    }
 
    if(!tweetId){
        throw new ApiError(400, "tweetId is required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    // 🔥 Authorization check
    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized")
    }

    await Tweet.findOneAndDelete(tweetId)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}