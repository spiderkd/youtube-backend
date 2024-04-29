import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res
  const { password, fullName, username, email } = req.body;
  //   console.log("email", email);
  //   console.log("req.body", req.body);

  if (
    [password, fullName, username, email].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required:(user.controller)");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file required ");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file required ");
  }
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully "));
});

export { registerUser };

//console.log(req.files); it gives below console
// [Object: null prototype] {
//     avatar: [
//       {
//         fieldname: 'avatar',
//         originalname: 'Screenshot 2023-05-14 084845.png',
//         encoding: '7bit',
//         mimetype: 'image/png',
//         destination: './public/temp',
//         filename: 'Screenshot 2023-05-14 084845.png',
//         path: 'public\\temp\\Screenshot 2023-05-14 084845.png',
//         size: 227945
//       }
//     ],
//     coverImage: [
//       {
//         fieldname: 'coverImage',
//         originalname: 'Screenshot 2023-07-17 021703.png',
//         encoding: '7bit',
//         mimetype: 'image/png',
//         destination: './public/temp',
//         filename: 'Screenshot 2023-07-17 021703.png',
//         path: 'public\\temp\\Screenshot 2023-07-17 021703.png',
//         size: 484861
//       }
//     ]
//   }

//console.log(req.body)
// req.body [Object: null prototype] {
//     fullName: 'yash kedia',
//     email: 'yash@gmail.com',
//     password: 'kdkdkdkdkd',
//     username: 'kd'
//   }
