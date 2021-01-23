import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";
import endpoints from "express-list-endpoints";

import User from "./models/user";
import Book from "./models/book";
import Bag from "./models/bag";

//Error messages from the server
const ERR_CANNOT_LOGIN = "Please try logging in again";
const ERR_CANNOT_ACCESS = "Access token is incorrect or missing";
const ERR_CANNOT_CREATE_USER =
  "Error while creating the user, please try again";

const mongoUrl =
  process.env.MONGO_URL || "mongodb://localhost/finalProjectBackend";
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.Promise = Promise;
mongoose.set("useCreateIndex", true);

const authenticateUser = async (req, res, next) => {
  try {
    const accessToken = req.header("Authorization");
    const user = await User.findOne({
      accessToken,
    });
    if (user) {
      req.user = user;
      next();
    } else if (!user) {
      throw "User not found";
    } else {
      res.status(401).json({ loggedOut: true, message: ERR_CANNOT_LOGIN });
    }
  } catch (err) {
    res.status(403).json({ message: ERR_CANNOT_ACCESS, errors: err });
  }
};

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
    const { email, password } = req.body;
    const user = await User.findOne({
      email,
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
  } catch (err) {
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
  } catch (err) {
    res.status(400).json({
      message: ERR_CANNOT_CREATE_USER,
      errors: err.errors,
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

app.use((request, response, next) => {
  if (mongoose.connection.readyState === 1) {
    console.log("Database working")
    next();
  } else {
    response.status(503).json({ error: "Service unavailable" });
  }
});

//Show all books
app.get('/books', async (request, response) => {
  const {title} = req.query
  if (title) {
    const allBooks = await Book.find({ title: title});
  response.json(allBooks);
  } else {
    const allBooks = await Book.find()
    response.json(allBooks);
  }
});

//Show all books by genre
app.get('/books/genre', async (req, res) => {
  const { genre } = req.query
  if (genre) {
    const allBooks = await Book.find({ genre: genre })
    res.json(allBooks)
  } else {
    const allBooks = await Book.find({
      $or: [
        { genre: /Fiction/ },
        { genre: /Nonfiction/ },
        { genre: /Mystery/ },
        { genre: /Thriller/ },
        { genre: /Horror/ }
        //add more genres as you go??
      ]
    })
    res.json(allBooks)
  }
})

//Show all bestsellers
app.get('books/bestseller', async (req,res) => {
  const { bestseller } = req.body
    if (bestseller === "Yes") {
      const allBooks = await Book.fin({bestseller: bestseller})
      res.json(allBooks)
    }
})

//Show all new releases
app.get('books/new_releases', async (req,res) => {
  const { new_releases } = req.body
    if (new_releases === "Yes") {
      const allBooks = await Book.fin({new_releases: new_releases})
      res.json(allBooks)
    }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
