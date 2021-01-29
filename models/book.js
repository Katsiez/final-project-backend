import mongoose from "mongoose";

 export const Book = mongoose.model("Book", {
  bookID: {
    type: Number
  },
  title: {
    type: String
  },
  authors: {
    type: String
  },
  average_rating: {
    type: Number
  },
  isbn13: {
    type: Number
  },
  bestseller: {
    type: String
  },
  num_pages: {
    type: Number
  },
  genre: {
    type: String
  },
  new_releases: {
    type: String
  },
  synopsis: {
    type: String
  },
  imageUrl: {
    type: String
  }
});


