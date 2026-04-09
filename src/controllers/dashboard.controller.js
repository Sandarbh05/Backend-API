import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const channelId = req.user._id

    if(!channelId){
        throw new ApiError(400, "channelId is a required field")
    }

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channelId")
    }

    const channelStats = await Video.aggregate([
        {
            $match: {
                owner : new mongoose.Types.ObjectId(channelId)
            },
        },
        {
                $group: {
                    _id: "$owner",
                    totalViews: { $sum: "$views"},
                    totalVideos: { $sum: 1},
                    videoIds: { $push: "$_id" }
                }
        },
        {    
            $lookup: {
                from: "likes",
                let: { videoIds: "$videoIds" },
                pipeline: [
                {
                    $match: {
                    $expr: {
                        $in: ["$video", "$$videoIds"]
                    }
                    }
                }
                ],
                as: "likes"
            }
        },
        {
            $addFields: { totalLikes: { $size: "$likes"}} 
        },
        {
            $lookup: {
                from: "subscriptions",
                let: { channelId: "$_id" },
                pipeline: [
                {
                    $match: {
                    $expr: {
                        $eq: ["$channel", "$$channelId"]
                    }
                    }
                }
                ],
                as: "subscribers"
            }
        },
        {
            $addFields: {
                totalSubscribers: { $size: "$subscribers" }
            }
        },
        {
            $project: {
                _id: 0,
                totalViews: 1,
                totalVideos: 1,
                videoIds: 1,
                totalLikes: 1,
                totalSubscribers: 1
            }
        },
    ])
    
    // likes: 1,
    // subscribers: 1,
    // title: 1,
    // thumbnail: 1,
    // duration: 1,
    // isPublished: 1,

    return res
    .status(200)
    .json(new ApiResponse(200, channelStats[0] || {
    totalViews: 0,
    totalVideos: 0,
    totalLikes: 0,
    totalSubscribers: 0
    }, "Channel stats fetched successfully"))
    //1) video queries to find count -> totalVideos, sum views -> total views, get VideoIds
    //2) subscription queries to find count -> totalSubscribers
    //3) Likes count where video C videoIds  




    //Steps
    //we require information from different modeled documents like Like, Video & Subscription
    //For counting total Likes we need to write aggregation pipeline ( have to use aggregation as it has its own model )
    //But inorder to get the video views we have to fetch the views field of the Video model, but we have to make a clear boundary line to decide how video views works, increased and counted systematically (Wall Hit) [ only field required, just query is enough]
    //We can fetch Subscription model for calculating total subscribers [ required aggregation pipelines ]
    //And for counting total videos published the user we have to look into the Video model where owner(from Video)==userId (from User) then we apply aggregation pipelines to calculate the size to get total Videos [need aggregation pipelines to count total no. of videos]

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.user._id

    if(!channelId){
        throw new ApiError(400, "channelId is a required field")
    }

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channelId")
    }

    // Query params (with defaults)
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $sort: {
                [sortBy] : sortType === "desc" ? -1 : 1
            }
        },
        {
            $skip: (pageNum - 1) * limitNum
        },
        {
            $limit: limitNum
        },
        {
            $project: {
                videoFile: 0,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "All User Videos fetched successfully"))
    //we can get all the videos uploaded by the channel but using aggregation pipelines starting with Video model with $match where owner = channelId, we get all the videos but 

})

export {
    getChannelStats, 
    getChannelVideos
    }