import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    //check for userId
    if(!userId){
        throw new ApiError(400, "userId is missing")
    }

    //validate userId
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId")
    }
    
    // 🔍 match stage
    const match = {
        owner: new mongoose.Types.ObjectId(userId),
        isPublished: true
    };

    //search wherever the title or description matches
    if (query) {
        match.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    // 📊 sort
    const sort = {
        [sortBy]: sortType === "desc" ? -1 : 1
    };

    // 🚀 aggregation pipeline
    const aggregate = Video.aggregate([
        {
            $match: match
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $sort: sort
        }
    ]);

    // 📄 pagination
    const options = {
        page: Number(page),
        limit: Number(limit)
    };

    const videos = await Video.aggregatePaginate(aggregate, options);

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetches successfully"))

    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if(!(title && description)){
        throw new ApiError(400, "Title & Description are required")
    }

    console.log(title, description);
    
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    // console.log(videoLocalPath, thumbnailLocalPath);

    if(!(videoLocalPath && thumbnailLocalPath)){
        throw new ApiError(400, "Video & Thumbnail are required")
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    
    // console.log(video, thumbnail)

    if(!(video && thumbnail)){
        throw new ApiError(400, "Upload failed")
    }

    const videotube = await Video.create({
        title,
        description,
        videoFile: video.secure_url || video.url,
        thumbnail: thumbnail.url,
        duration: video.duration || 0,
        owner: req.user._id
    }) 

    return res
    .status(200)
    .json(new ApiResponse(200, videotube, "Video Published Successfully"))

    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "videoId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video does not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video by ID fetched successfully"))
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "videoId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    //Taking new input text fields
    const { newTitle, newDescription } = req.body

    //Taking new input file field 
    // const thumbnailLocalPath = req.files?.thumbnail[0].path ?? null;
    const thumbnailLocalPath = (req.file?.path) ?? null;

    //Getting old video's information like title, description & thumbnail :
    const oldVideo = await Video.findById(videoId)

    //Check : 
    if (!oldVideo) {
        throw new ApiError(404, "Video not found")
    }
    //Saving either of new information or old one based on inputs provided or not :
    const title = newTitle ?? oldVideo.title;
    const description = newDescription ?? oldVideo.description;

    const thumbnail = thumbnailLocalPath ? (await uploadOnCloudinary(thumbnailLocalPath)).url : oldVideo.thumbnail;
    

    //Debug
    // console.log( "this is title ", title, "this is description : ", description, "time for thumbnail: " , thumbnail)

    //Saving in db
    const video =  await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail,
            }
        },
        {new: true}
    ).select("title description thumbnail")

    return res
    .status(200)
    .json( new ApiResponse(200, video, "Video details updated successfully"))

    //take new thumbnail, upload it on cloudinary and get a url
    //take title and description strings and use findByIdAndUpdate method to update the fields
    //send response

    //one bug to fix : its giving old thumbnail's image in the postman --> its fixed now
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!videoId){
        throw new ApiError(400, "videoId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    //Check if the user is authorized
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized")
    }

    await Video.findByIdAndDelete(videoId);

    //In a single query [Most Optimal] : 
    // const video = await Video.findOneAndDelete({
    //     _id: videoId,
    //     owner: req.user._id
    // })
    // if (!video) {
    //     throw new ApiError(404, "Video not found or unauthorized")
    // }

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"))

    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400, "videoId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !(video.isPublished)
            }
        },
        {new: true}
    ).select("isPublished")

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video Publish toggled successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}