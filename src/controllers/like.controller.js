import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    const {videoId} = req.params

    if(!videoId){
        throw new ApiError(404, "videoId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    if(existingLike){
        await existingLike.deleteOne()

    }else{
        await Like.create({
            video: videoId,
            likedBy: req.user._id
        })
    }

    return res.
    status(200)
    .json(new ApiResponse(200, !existingLike, "Video Like toggled successfully"))



})

const toggleCommentLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on comment
    const {commentId} = req.params

    if(!commentId){
        throw new ApiError(404, "commentId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "comment not found")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if(existingLike){
        await existingLike.deleteOne()
    }else{
        await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
    }

    return res
    .status(200)
    .json(new ApiResponse(200, !existingLike, "Comment Like toggled successfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet
    const { tweetId } = req.params

    if(!tweetId){
        throw new ApiError(400, "tweetId is required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "tweet not found")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if(existingLike){
        await existingLike.deleteOne()
    }else{
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })
    }   

    return res
    .status(200)
    .json(new ApiResponse(200, !existingLike, "Tweet Like toggled successfully"))

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

     const likes = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $ne: null } // only video likes
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
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
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $project: {
                _id: 0,
                videoId: "$videoDetails._id",
                title: "$videoDetails.title",
                description: "$videoDetails.description",
                views: "$videoDetails.views",
                owner: "$videoDetails.owner",
                createdAt: "$videoDetails.createdAt"
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, likes, "All Liked Videos fetched successfully"))


})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}