import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";
import endpoints from "express-list-endpoints";
//import knex from "knex"

const mongoUrl =
  process.env.MONGO_URL || "mongodb://localhost/finalProjectBackend";
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.Promise = Promise;
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    minlength: 5,
    maxlength: 20,
    unique: true,
    required: true,
  },
  lastName: {
    type: String,
    minlength: 5,
    maxlength: 20,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    minlength: 6,
    required: true,
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex"),
  },
});

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
      res
        .status(401)
        .json({ loggedOut: true, message: "Please try logging in again" });
    }
  } catch (err) {
    res
      .status(403)
      .json({ message: "Access token is incorrect or missing", errors: err });
  }
};

const User = mongoose.model("User", userSchema);

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

//Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
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
        password: user.password
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

// Sign-up
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("!!!", name, email, password);
    const user = new User({
      name,
      email,
      password: bcrypt.hashSync(password),
    });
    await user.save();
    res.status(201).json({
      message: "User created!",
      id: user._id,
      accessToken: user.accessToken,
      name: user.name,
      email: user.email,
      password: user.password,
    });
  } catch (err) {
    res.status(400).json({
      message: "Could not create user!",
      errors: err.errors,
    });
  }
});

//User specific info, secret page only available after log in, found in 'userprofile'
app.get("/users/:id/secret", authenticateUser);
app.get("/users/:id/secret", async (req, res) => {
  try {
    const userId = req.params.id;
    if (userId != req.user._id) {
      console.log(
        "Authenticated user does not have access to this secret.  It's someone else's!"
      );
      throw "Access denied";
    }
    const secretMessage = `This is a secret message for ${req.user.name}. Welcome onboard!`;
    res.status(200).json({
      secretMessage,
    });
  } catch (err) {
    res.status(403).json({
      error: "Access Denied",
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
