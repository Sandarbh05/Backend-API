import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const userId = req.user._id

    if(!name){
        throw new ApiError(400, "Playlist title is required")
    }

    const playlist = await Playlist.create({
        name,
        description: description || "",
        owner: userId
    })

    return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"))
    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!userId){
        throw new ApiError(400, "userId is required")
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            thumbnail: 1,
                            views: 1,
                            duration: 1
                        }
                    }
                ]
            }
        },
        {
            $sort: { createdAt: -1}
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                videos: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlists fetched successfully"))

    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    
    if(!playlistId){
        throw new ApiError(400, "playlistId is required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }

    // const playlist = await Playlist.findOne({
    //     owner: playlistId
    // })

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            thumbnail: 1,
                            views: 1,
                            duration: 1,
                        }
                    },
                ]
            }
        },
        //we are fetching all the fields on frontend so no $project pipeline needed
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, playlist[0] || {}, "Playlist fetched successfully"))
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId){
        throw new ApiError(400, "playlistId is required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }

    if(!videoId){
        throw new ApiError(400, "videoId is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        { new: true}        
    )

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId){
        throw new ApiError(400, "playlistId is required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }

    if(!videoId){
        throw new ApiError(400, "videoId is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // Authorization check
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized")
    }

    await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video removed successfully"))
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId){
        throw new ApiError(400, "playlistId is required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // Authorization check
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"))

    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!playlistId){
        throw new ApiError(400, "playlistId is required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(403, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "Forbidden")
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: updateData },
        {  returnDocument: "after" }
    )

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}