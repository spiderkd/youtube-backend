import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload file on the cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    //file has been updated
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //removes the locally saved temp files as the upload operation got failed
    return null;
  }
};

export { uploadOnCloudinary };

//its a boiler plate kinda code below
// cloudinary.uploader.upload(
//   "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" },
//   function (error, result) {
//     console.log(result);
//   }
// );

// console.log(
//   "response whole",
//   response
// );
//it gives below console
//asset_id: '48675e6b142735e52881c4c0bb7e3e0d',
// public_id: 'niwbvoxsvfmiy7anjwrk',
// version: 1714414906,
// version_id: '8235558a775ea90094e6ec734fed6ea5',
// signature: '57a1307e26958413206ca3bb873d0c56641ee5ab',
// width: 1723,
// height: 900,
// format: 'png',
// resource_type: 'image',
// created_at: '2024-04-29T18:21:46Z',
// tags: [],
// bytes: 484861,
// type: 'upload',
// etag: 'e5c7575d50ad174fb43635252f6bd633',
// placeholder: false,
// url: 'http://res.cloudinary.com/dzcjcmtbx/image/upload/v1714414906/niwbvoxsvfmiy7anjwrk.png',
// secure_url: 'https://res.cloudinary.com/dzcjcmtbx/image/upload/v1714414906/niwbvoxsvfmiy7anjwrk.png',
// folder: '',
// original_filename: 'Screenshot 2023-07-17 021703',
// api_key: '913558866187218'
// }
