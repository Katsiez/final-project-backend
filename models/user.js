import mongoose from "mongoose";
import crypto from "crypto";

export const User = mongoose.model("User", {
	firstName: {
	  type: String,
	  minlength: 5,
	  maxlength: 20,
	  unique: true,
	  required: [true, 'First name is missing'],
	},
	lastName: {
	  type: String,
	  minlength: 5,
	  maxlength: 20,
	  unique: true,
	  required: [true, 'Last name is missing'],
	},
	email: {
	  type: String,
	  unique: true,
	  required: [true, 'Email is required'],
	},
	password: {
	  type: String,
	  minlength: [6, 'Password is missing'],
	  required: true,
	},
	accessToken: {
	  type: String,
	  default: () => crypto.randomBytes(128).toString("hex"),
	},
  });