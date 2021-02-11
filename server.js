const express = require("express");
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto"
import endpoints from "express-list-endpoints";
import dotenv from "dotenv";
import cloudinaryFramework from "cloudinary";
import multer from "multer";
import cloudinaryStorage from "multer-storage-cloudinary";

//import { User } from "./models/user";
import { Book } from "./models/book";
import { Cart } from "./models/cart";
import booksData from "./models/data/books.json";
import bestsellersData from "./models/data/bestsellers.json";

//Cloudinary image storage
dotenv.config();

//Set up MongoDB
const mongoUrl =
  process.env.MONGO_URL || "mongodb://localhost/finalProjectBackend";
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.Promise = Promise;
mongoose.set("useCreateIndex", true);

//   PORT=8000 npm start
const port = process.env.PORT || 8000;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(bodyParser.json());

/////////////////////////////////////////////
//Set up Cloudinary
const cloudinary = cloudinaryFramework.v2;
cloudinary.config({
  cloud_name: "katsiez",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = cloudinaryStorage({
  cloudinary,
  params: {
    folder: "books",
    allowedFormats: ["jpg", "png", "gif"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});
const parser = multer({ storage });
/////////////////////////////////////////////

/////////////////////////////////////////////////////
//error messages from the server
const ERR_CANNOT_ADD_IMAGE = "Cannot load the image";
////////////////////////////////////////////////////////

///////////////***USER SCHEMA***///////////////
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    maxlength: 20,
    unique: true,
    required: true
  },
  password: {
    type: String,
    minlength: 6,
    maxlength: 10,
    required: true
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex"),
    unique: true
  },
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  const salt = bcrypt.genSaltSync(10);
  user.password = bcrypt.hashSync(user.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);

//* USER AUTHENTICATION *//
const authenticateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({
      accessToken: req.header("Authorization"),
    });

    if (user) {
      req.user = user;
      next();
    } else {
      res.status(401).json({ loggedOut: true, message: "Please log in again" });
    }
  } catch (err) {
    res
      .status(403)
      .json({ message: "Access token is missing or wrong", errors: err });
  }
};

// Lising all endpoints
app.get("/", (req, res) => {
  res.send(endpoints(app));
});

//Sign-up
app.post("/signup", async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await new User({ name, password }).save();

    res.status(201).json({ userId: user._id, accessToken: user.accessToken });
  } catch (error) {
    res.status(400).json({ message: "Could not create user", error });
  }
});

//User specific info, secret page only available after log in, found in "userprofile"
app.get("/signup/:id/verified", authenticateUser);
app.get("/signup/:id/verified", (req, res) => {
  const secretMessage = `Hello ${req.user.name}, welcome onboard`;
  res.status(201).json({ secretMessage });
});


//Login
app.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findOne({ name });
    console.log(user);
    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(201).json({ userId: user._id, accessToken: user.accessToken });
    } else {
      res
        .status(404)
        .json({
          notFound: true,
          message: "Please verify username and password",
        });
    }
  } catch (err) {
    res
      .status(404)
      .json({ notFound: true, message: "Please verify username and password" });
  }
});

////////////////////////////////***BOOK MODEL***////////////////////////////////
//Seed the database
if (process.env.RESET_DATABASE) {
const seedDatabase = async () => {
  await Book.deleteMany({});

  booksData.forEach((bookData) => {
    new Book(bookData).save();
  });
};
seedDatabase();
}

//Show all books
app.get("/books", async (req, res) => {
  const allBooks = await Book.find();
  res.json(allBooks);
});
// app.get("/books", async (req, res) => {
//   const booksCount = booksData.length
//   const perPage = 30
//   const pageCount = Math.ceil(booksCount / perPage)

//   let page = parseInt(req.query.p)
//   if (page <1) page = 1
//   if (page > pageCount) page = pageCount

//   const from = perPage * (page-1)
//   let to = page * perPage
//   if(to<0) to = 0

//   res.json({
//     books: booksData.slice(from, to),
//     page,
//     pageCount
//   })
// });


//Add book images for each book
app.post("/books/:id/image", parser.single("image"), async (req, res) => {
  const { id } = req.params;
  const { path } = req.file;
  const { filename } = req.file;

  console.log(`POST /books/${id}/image`);
  try {
    const updatedBook = await Book.findOneAndUpdate(
      { _id: id },
      { imageUrl: path, imageName: filename },
      { new: true }
    );
    res.status(201).json(updatedBook);
  } catch (err) {
    res.status(400).json({ message: ERR_CANNOT_ADD_IMAGE, errors: err });
  }
});

// Show a single book based on the ID - example path: books/1
app.get("/books/book/:bookID", (req, res) => {
  const bookID = req.params.bookID;
  const singleBook = booksData.find((item) => item.bookID === +bookID);

  if (!singleBook) {
    res.status(404).json("Sorry, could not find books with that ID :(");
  }

  res.json(singleBook);
});

//Show all books by genre
//http://localhost:8000/books/fiction
app.get("/books/:genre", async (req, res) => {
  const bookGenre = req.params.genre;
  let filteredBooks = booksData;

  if (bookGenre) {
    filteredBooks = filteredBooks.filter((book) => {
      let thisGenre = book.genre.toString().toLowerCase();
      return thisGenre.includes(bookGenre);
    });
  } //handle response when genre not found??
  res.json(filteredBooks);
});

//Show all bestsellers
//http://localhost:8000/books/bestseller/bestseller
app.get("/books/bestseller/:bestseller", async (req, res) => {
  const bestsellerBooks = req.params.bestseller;
  let filteredBestsellers = bestsellersData;

  if (bestsellerBooks) {
    filteredBestsellers = filteredBestsellers.filter((book) => {
      let bookBestseller = book.bestseller.toString().toLocaleLowerCase();
      return bookBestseller.includes(bestsellerBooks);
    });
    res.json(filteredBestsellers);
  }
});

//Show top-rated books
app.get("/books/top-rated/:top-rated", async (req, res) => {
  const topRatedBooks = booksData.filter((book) => book.average_rating >= 4);
  let firstTwentyTopBooks = topRatedBooks.slice(0, 20);
  res.json(firstTwentyTopBooks);
});

//Show all new releases
app.get("/books/new_releases/:new_releases", async (req, res) => {
  const newreleasesBooks = req.params.new_releases;
  let filteredBooks = booksData;

  if (newreleasesBooks === "new_releases") {
    filteredBooks = filteredBooks.filter((book) => {
      let newlyreleased = book.new_releases.toString().toLocaleLowerCase();
      return newlyreleased.includes(newreleasesBooks);
    });
    res.json(filteredBooks);
  }
});

//***CART MODEL***//
//Add books to shopping cart
app.post("/cart", async (req, res) => {
  try {
    const { imageUrl, title, authors, price, quanitity, isbn13 } = req.body;

    const cartItem = new Cart({
      imageUrl,
      title,
      authors,
      price,
      quanitity,
      isbn13
    });
    const newCartItem = await cartItem.save();
    res
      .status(201)
      .json({ message: "Book added to your cart", item: newCartItem });
  } catch (err) {
    res.status(400).json({
      message: "Something went wrong. Try adding that book in again!",
      errors: err,
    });
  }
});

//Not sure if I want to have this part, but to take an item out, I probably need to have an endpoint to add more items first??
//Up the quantity of books
app.put("/cart/:id/add", async (req, res) => {
  const { id } = req.params;
  const book = await Cart.findOne({ id: id });
  console.log(book);
  try {
    if (book.quantity === 1) {
      const removeBook = await Cart.deleteOne({ id: id });
      res
        .status(201)
        .json({ message: `Book removed from shopping cart`, item: removeBook });
    } else {
      const updatedCartItem = await Cart.updateOne(
        { id: id },
        { $inc: { quantity: -1 } }
      );
      res.status(201).json({
        message: `Updated shopping cart with with book id:${id}`,
        item: updatedCartItem,
      });
    }
  } catch (err) {
    res.status(400).json({
      message: `Could not update shopping cart with book id:${id}`,
      errors: err,
    });
  }
});

//Remove one book (1 quantity)
app.delete("/cart/:id/remove", async (req, res) => {
  const { id } = req.params;
  const removeBook = await Cart.deleteOne({ id: id });
  res.status(201).json({
    message: `Book with id:${id} deleted from shopping cart`,
    item: removeBook,
  });
});

//Remove all books from shopping cart, clear all
app.delete("/cart", async (req, res) => {
  const cartItems = await Cart.deleteMany();
  res
    .status(201)
    .json({ message: "Your shopping cart is empty", items: cartItems });
});

//Find books added to shopping cart
app.get("/cart", async (req, res) => {
  const cartItems = await Cart.find();
  res.status(201).json({
    message: "Found some books in your shopping cart!",
    cartItems: cartItems,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
