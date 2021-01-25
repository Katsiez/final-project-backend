import mongoose from "mongoose";
import booksData from "./data/books.json";

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
  }
});

//Seed the database
// if (process.env.RESET_DATABASE) {
  const seedDatabase = async () => {
    await Book.deleteMany({});
    
    booksData.forEach((bookData) => {
      new Book(bookData).save();
    });
  };
  seedDatabase();
// }
