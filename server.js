import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";
import endpoints from "express-list-endpoints";

import User from "./models/user";
// import Book from "./models/book";
import Bag from "./models/bag";
import booksData from "./models/data/books.json";
import { readFile } from "fs";


//error messages from the server
const error_CANNOT_LOGIN = "Please try logging in again";
const error_CANNOT_ACCESS = "Access token is incorrect or missing";
const error_CANNOT_CREATE_USER =
  "error while creating the user, please try again";

const mongoUrl =
  process.env.MONGO_URL || "mongodb://localhost/finalProjectBackend";
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.Promise = Promise;
mongoose.set("useCreateIndex", true);

//books model that for now lives here
const Book = mongoose.model("Book", {
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

//* USER AUTHENTICATION *//
const authenticateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ accessToken: req.header('Authorization') })
    if (user) {
      req.user = user
      next()
    } else {
      res.status(401).json({ loggedOut: true, message: error_CANNOT_LOGIN })
    }
  } catch (error) {
    res.status(403).json({ message: error_CANNOT_ACCESS, errors: error.errors })
  }
}
//   PORT=8000 npm start
const port = process.env.PORT || 8000;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(bodyParser.json());

// Lising all endpoints
app.get("/", (req, res) => {
  res.send(endpoints(app));
});

//***USER MODEL***//

//Login
app.post("/login", async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;
    const user = await User.findOne({
      email
    });
    console.log(user);
    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(201).json({
        userId: user._id,
        accessToken: user.accessToken,
        name: user.name,
        email: user.email,
        password: user.password,
      });
    } else {
      res.status(404).json({
        notFound: true,
        message: "Incorrect username and/or password",
      });
    }
  } catch (error) {
    res.status(404).json({
      notFound: true,
      message: "Incorrect username and/or password",
    });
  }
});

//Sign-up
app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    console.log("!!!", firstName, lastName, email, password);
    const user = new User({
      firstName,
      lastName,
      email,
      password: bcrypt.hashSync(password),
    });
    const userCreated = await user.save();

    res.status(201).json({
      message: "Account created!",
      userId: userCreated._id,
      accessToken: userCreated.accessToken,
      firstName: userCreated.firstName,
      lastName: userCreated.lastName,
      email: userCreated.email,
      password: userCreated.password,
    });
    
  } catch (error) {
    res.status(400).json({
      message: error_CANNOT_CREATE_USER,
      errors: error.errors,
    });
  }
});

//User specific info, secret page only available after log in, found in 'userprofile'
app.get("/users/:id/verified", authenticateUser);
app.get("/users/:id/verified", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    res.status(201).json({
      userId: userCreated._id,
      firstName: userCreated.firstName,
      lastName: userCreated.lastName,
      email: userCreated.email,
    });
  } else {
    res.status(400).json({ message: "Access denied" });
  }
});

//***BOOK MODEL***//
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
app.get('/books', async (req, res) => {
  const allBooks = await Book.find();
  res.json(allBooks);
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
//http://localhost:8000/books/bestseller/bestsellers
app.get('/books/bestseller/:bestsellers', async (req,res) => {
  const bestsellerBooks = req.params.bestsellers
  let filteredBooks = booksData;

    if (bestsellerBooks) {
      filteredBooks = filteredBooks.filter((book) => {
        let bookBestseller = book.bestseller.toString().toLocaleLowerCase()
        return bookBestseller.includes(bestsellerBooks)
      })
      res.json(filteredBooks)
    } 
})

//Show all new releases
app.get('/books/new_releases/:new_releases', async (req,res) => {
  const newreleasesBooks = req.params.new_releases
  let filteredBooks = booksData;

    if (newreleasesBooks) {
      filteredBooks = filteredBooks.filter((book) => {
        let newlyreleased = book.new_releases.toString().toLocaleLowerCase()
        return newlyreleased.includes(newreleasesBooks)
      })
      res.json(filteredBooks)
    } 
})


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
