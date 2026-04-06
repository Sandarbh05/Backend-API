import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription

    const { channelId } = req.params
    const userId = req.user._id

    if(!channelId){
        throw new ApiError(400, "channelId is required")
    }

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channelId")
    }

    if(!userId){
        throw new ApiError(400, "user is missing")
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId")
    }
    
    // if(String(userId) === String(channelId)){
    //     throw new ApiError(400, "Cannot subscribe to yourself")
    // } // turn this block off for testing toggleSubscriptions

    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(404, "Channel not found")
    }

    const subscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    if(subscription){
        await subscription.deleteOne()
    }else{
        await Subscription.create({
            subscriber: userId,
            channel: channelId
        })
    }

//OPTIMIZATION:
//     const existing = await Subscription.findOne({
//     subscriber: userId,
//     channel: channelId
// })

// if (existing) {
//     await Subscription.findByIdAndDelete(existing._id)
// } else {
//     await Subscription.create({
//         subscriber: userId,
//         channel: channelId
//     })
// }
    return res
    .status(200)
    .json(new ApiResponse(200, !subscription, "Channel subscription toggled successfully"))

    //check if user is already subscribed to this channel or not, if he is then we just delete the document

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const userId = req.user?._id
 
    if(!subscriberId){
        throw new ApiError(400, "subscriberId is required")
    }

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid subscriberId")
    }

    const subscribers = await Subscription.aggregate([
        //Pipeline - 1 (searching)
        {
            $match: {
                //have to check for userid == subscriberId
                //have to get the ids of all the users subscribed to that channel in an object along with their avatar and username/fullname
                //we should be able to get the subscribers list of any channel we wish as we are taking subscriberId as our input
                channel: new mongoose.Types.ObjectId(subscriberId)
                //now we got the channel
            }
        },
        //Pipeline - 2 (adding the subscribers list)
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
                //sub-pipelines: 
                pipeline: [
                    //Sub-Pipeline - 1 (To take only the necessary information like fullName, username & avatar)
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
            $unwind: "$subscriberDetails"
        },
        {
            $group: {
                _id: "$channel",
                subscribers: { $push: "$subscriberDetails"},
                subscriberIds: { $push: "$subscriber"}
            }
        },
        {
            $addFields: {
                subscriberCount: { $size: "$subscribers"},
                isSubscribed: {
                    $in: [new mongoose.Types.ObjectId(userId), "$subscriberIds"]
                }
            }
        },
        //Pipeline - 4 (projection)
        {
            $project: {
                _id: 0,
                subscribers: 1,
                subscriberCount: 1,
                isSubscribed: 1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subscribers[0] || {}, "Channel Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const userId = req.user._id

    if(!subscriberId){
        throw new ApiError(400, "subscriberId is required")
    }

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid subscriberId")
    }

    if(!userId){
        throw new ApiError(400, "userId is required")
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId")
    }

    //Authorization check
    if(subscriberId.toString() != userId.toString()){
        throw new ApiError(404, "Unauthorized Access")
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
                //sub-pipeline : 
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username : 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $group: {
                _id: "$subscriber",
                channels: { $push: "$channelDetails" },
                channelIds: { $push: "$channel"}
            }
        },
        {
            $addFields: {
                channelCount: {
                    $size: "$channels"
                }
            }
        },
        {
            $project: {
                _id: 0,
                channels: 1,
                channelCount: 1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, channels[0] || {}, "Subscribed Channels fetched successfully"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}