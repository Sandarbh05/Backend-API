import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh & access tokens")
    }
}

const registerUser=asyncHandler( async (req, res) => {
    // Todo : console log req.body, response of cloudinary, req.files

    //get user details from frontend
    //validation - not empty
    //check if user already exists: email/username
    //check for files(images, avatar)
    //upload them to cloudinary, avatar at multer & cloudinary check
    //create user object - create entry in db
    //remove password & refresh token field from response
    //check for user creation 
    //return response

    // req.body --> form or json


    const { fullName, email, username, password } = req.body;

    if(
        [fullName, email, username, password].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser=await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user=await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

} ) 

const loginUser=asyncHandler( async(req, res) => {
    //Todo:
    //req-body --> data
    //username or email(validation)
    //find the user
    //password check
    //access & refresh tokens
    //send cookies for above
    //success response

    const {email, username, password} = req.body

    if(!username && !email){
        throw new ApiError(400, "username or password is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(404, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )

})

const logoutUser=asyncHandler( async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // $set: {
            //     refreshToken: undefined
            // }  
            $unset: {
                refreshToken: 1 // this removes the field from the document
            }

        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secured: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler( async(req, res) => {
    //access cookies
    //taking refresh token from cookie
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    //validating refresh token
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        // decoding the taken refresh token
        const decodedToken = jwt.verify(
            incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
        )
    
        //finding user for the found refresh token
        const user = await User.findById(decodedToken?._id)
    
        //throw error if no user found
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        //checking if cookie-based-refresh-token matches with one saved in the db for the user
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        //if matching true, then giving new tokens for regenerating the session & storing the reference
        const {accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
        
        //setting options so cookies can't se configured in the frontend
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken : newRefreshToken},
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }


})

const changeCurrentPassword = asyncHandler( async(req, res) => {
    const { oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

const getCurrentUser = asyncHandler( async(req, res) => {
    const user = req.user
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Current User Information Fetched Successfully"))
})

const updateAccountDetails = asyncHandler( async(req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated Successfully"))
})

const updateUserAvatar = asyncHandler( async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "User Avatar Updated Successfully"))
})

const updateUserCoverImage = asyncHandler( async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage){
        throw new ApiError(400, "Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "User Cover Image Updated Successfully"))
})

const getUserChannelProfile = asyncHandler( async(req, res) => {
    // take username from the url
    const {username} = req.params

    //check for null username
    if(!username?.trim()){
        throw new ApiError(400, "username missing")
    }

    const channel = await User.aggregate([
        //pipeline for finding channel
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        //pipeline for finding how much subscribers the channel has
        {
            $lookup: {
                from: "subscriptions", // model name is saved with lowercase & plural format in db originally being Subscription
                localField: "_id",
                foreignField: "channel", // gives users which have subscribed to this channel
                as: "subscribers"
            }
        },
        //pipeline for finding how many channels the channel user has subscribed to
        {
            $lookup: {
                from: "subscriptions", // model name from the foreign document
                localField: "_id",
                foreignField: "subscriber", // gives channels where the user is subscribed to 
                as: "subscribedTo"
            }
        },
        //pipeline for adding the values of fields of the returned array output
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers", // $ as subscribers is the field of the returned array
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo" // $ as subscribedTo is also the field of the returned array
                },
                //check for subscribe flag
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]}, //checking if id of the user logged in is same as the id of the channel subscriber
                        then: true,
                        else: false
                    }
                }
            }
        },
        //pipeline for providing only specific fields not the entire fields from db
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User Channel fetched successfully"))

})

const getWatchHistory = asyncHandler( async(req, res) => {
    // aggregation code are not send directly to mongodb instead of mongoose so _id is object(string)
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                //subpipeline
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
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]          
            }
        },
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch History fetched successfully"))
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}