import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";



const registerUser = asyncHandler( async (req, res) => {
    // 1.get user details from frontend
    // 2.validation - not epty
    // 3.check if user already exists: username, email
    // 4.check for images, check for avtar
    // 5.upload them to cloudinary, avtar
    // 6.reate user obect - create entry in db
    // 7.remove password and refresh token field from respoonses
    // 8.check for user creation 
    // 9.return response

    // 1st step: 
    const { fullName, email, username, password } = req.body
    console.log("email", email);
    // 2nd step:

    if (
        [fullName, email, username, password].some((field) => 
        field?.trim() === "") 
    ){
        throw new ApiError(400, "All fields is required")
    }

    // 3rd step:
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if(existedUser) {
        throw new ApiError(409, "user with email or username already exist")
    }

    // 4th step:
    const avtarLocalPath = req.files?avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    if( !avtarLocalPath) {
        throw new ApiError(400, "avtar file is required")
    }
    // 5th step:
   const avatar = await uploadOnCloudinary(avtarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avtar file is required")
    }

    // 6th step:
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


    // 7th step:
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // 8th step:
    if(!createdUser) {
        throw new ApiError(500, "somthing went wrong while registering the user")
    }

    // 9th step:
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered")
        //Successfully()
    )


}) 



export {registerUser}