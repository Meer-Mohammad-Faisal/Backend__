import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


// making fuction of access refresh token
const generateAccessAndRefereshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.genrateAccessToken()
        const refreshToken = user.genrateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validBeforeSave: false })

        return {accessToken, refreshToken}
    }
    catch(error) {
        throw new ApiError(500, "smothing went wrong while genrating and refresh token")

    }
}



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
    // console.log("email", email);
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
    console.log(req.files);

    // 4th step:
    const avatarLocalPath = req.files?.avatar && req.files.avatar.length > 0
    ? req.files.avatar[0].path
    : null; 
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.
        coverImage) && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files.coverImage[0].path
        }






    if( !avatarLocalPath) {
        throw new ApiError(400, "avtar file is required")
    }
    // 5th step:
   const avatar = await uploadOnCloudinary(avatarLocalPath)
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


// lecture 15(access refresh token and middleware and cookies)
// NOW FOR LOGIN USER:--

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    // if (!username && !email) {
    //     throw new ApiError(400, "username or email is required")
    // }
    
   
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
        
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

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
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})




const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})







export {
    registerUser,
    loginUser,
    logoutUser
}