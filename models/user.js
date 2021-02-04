// import mongoose from "mongoose";
// import crypto from "crypto";

// export const userSchema = new mongoose.Schema({
// 	firstName: {
// 	  type: String,
// 	  minlength: 3,
// 	  maxlength: 20,
// 	  unique: true,
// 	  required: [true, 'First name is missing'],
// 	},
// 	lastName: {
// 	  type: String,
// 	  minlength: 3,
// 	  maxlength: 20,
// 	  unique: true,
// 	  required: [true, 'Last name is missing'],
// 	},
// 	email: {
// 	  type: String,
// 	  unique: true,
// 	  required: [true, 'Email is required'],
// 	},
// 	password: {
// 	  type: String,
// 	  minlength: [6, 'Password is missing'],
// 	  maxlength: [10, 'Password is too long'],
// 	  required: true,
// 	},
// 	accessToken: {
// 	  type: String,
// 	  default: () => crypto.randomBytes(128).toString("hex"),
// 	  unique: true
// 	},
//   });

