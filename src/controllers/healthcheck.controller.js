import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler( async(_, res) => {
    //TODO: build a health check response that simply returns the OK status as json with a message
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Everything is OK"))
})

export { healthcheck }