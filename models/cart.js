import mongoose from "mongoose";

export const Cart = mongoose.model("Cart", {
	imageUrl: {
		type: String
	},
	title: {
		type: String
	  },
	authors: {
		type: String
	  },
	price: {
		type: Number
	  },
	quantity: {
		type: Number,
		default: 0
	  },
	isbn13: {
		type: Number
	  }
})

