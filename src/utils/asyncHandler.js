//const asyncHandler = (fn) => {() => {}}; can be shortened as below if we want to take some function
//and for async we can write const asyncHandler = (fn) => { async () => {}};
//Now for the code with try catch is below
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

import { error } from "console";
import { promises } from "dns";

//code for promise is below

const asyncHandler = (requestHandler) => {
  (res, req, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

export default asyncHandler;
