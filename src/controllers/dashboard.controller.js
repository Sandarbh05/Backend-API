import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    //Steps
    //we require information from different modeled documents like Like, Video & Subscription
    //For counting total Likes we need to write aggregation pipeline
    //But inorder to get the video views we have to fetch the views field of the Video model, but we have to make a clear boundary line to decide how video views works, increased and counted systematically (Wall Hit)
    //We can fetch Subscription model for calculating total subscribers
    //And for counting total videos published the user we have to look into the Video model where owner(from Video)==userId (from User) then we apply aggregation pipelines to calculate the size to get total Videos


})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }