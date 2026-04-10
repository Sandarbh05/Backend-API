import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId){
        throw new ApiError(400, "videoId is required")
    }

    const aggregate = Comment.aggregate([
    {
        $match: {
            video: new mongoose.Types.ObjectId(videoId)
        }
    },
    {
        $sort: { createdAt: -1 }
    }
    ]);
    
    //pagination 
    const options = {
        page: Number(page),
        limit: Number(limit)
    }

    const comments = await Comment.aggregatePaginate(aggregate, options);

    return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body || {}
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "videoId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if(!content){
        throw new ApiError(400, "Comment content missing")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body

    if(!commentId){
        throw new ApiError(400, "commentId is required")
    }
    
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }
    
    if(!content){
        throw new ApiError(400, "Comment content missing")
    }

    //Optimization :
    const comment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user._id },
        { $set: { content } },
        { new: true }
    ).select("content")

    if (!comment) {
        throw new ApiError(404, "Comment not found or unauthorized")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const { commentId } = req.params
    
    //Required Field Validation Check:
    if(!commentId){
        throw new ApiError(400, "commentId is required")
    }
    
    //Format Validation Check:
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    const comment = await Comment.findById(commentId)

    //Resource Existence Check:
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    //Authorization check:
    if (comment.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Unauthorized")
    }
    
    await Comment.findByIdAndDelete(commentId);

    //Optimization: 
    // await comment.deleteone()

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Comment deleted successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }