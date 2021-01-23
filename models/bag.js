import mongoose from "mongoose";

export const Bag = mongoose.model('bag', {
	//image??
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
	  },
	
})