require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const mongoose = require("mongoose");
const { UserModel } = require("./userModel");
const { BlogPostModel } = require("./blogpostModel");

const app = express();
const PORT = 3000;
app.use(express.json());
mongoose.connect(
  "mongodb+srv://admin:cohort4@cluster0-szzhr.mongodb.net/authBlog?retryWrites=true&w=majority",
  {
    useUnifiedTopology: true,
    useNewURLParser: true,
  }
);

//Originally full arrays of hardcoded data - no longer needed w. db connection
// const users = [];
// const blogPosts = [];

app.get("/", async (request, response) => {
  try {
    response.sendFile(path.join(__dirname + "/index.html"));
  } catch (error) {
    response.status(500).send(error);
  }
});

app.get("/index.js", async (request, response) => {
  try {
    response.sendFile(path.join(__dirname + "/index.js"));
  } catch (error) {
    response.status(500).send(error);
  }
});

app.get("/users", async (request, response) => {
  let users = await UserModel.find({});
  response.json(users);
});

app.get("/user", authorizeUser, async (request, response) => {
  console.log(request.user);
  let user = await UserModel.find({ username: request.user.username });
  response.json(user);
});
//authorize w jwt
//after authorize, pull username out of jwt

// Post request to create user - Sign UP/ Register
// created user
// provided access token
app.post("/user", async (request, response) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPwd = await bcrypt.hash(request.body.password, salt);
    const user = {
      username: request.body.username,
      password: hashedPwd,
    };
    const createdUser = await UserModel.create(user);
    console.log(createdUser);
    // users.push(user);
    const userInput = { username: createdUser.username };
    const accessToken = jwt.sign(userInput, process.env.ACCESS_TOKEN_SECRET);
    response
      .status(201)
      .cookie("userAccessToken", accessToken)
      .redirect(303, "/users/landing"); //redirect does the send for us
  } catch (error) {
    console.log(error);
    response.status(500).send(error);
  }
});

// Sign IN
// [X] redirect path to landing page, confirm tests OK, THEN...
// [X] give auth token
app.post("/users/login", async (request, response) => {
  try {
    const userArray = await UserModel.find({
      username: request.body.username,
    });
    let user = userArray[0]; //shortcut
    // const user = users.find(
    //   (user) => user.username === request.body.username //returns user if found
    // );
    if (user === null) {
      response.sendStatus(404).send("User Not Found");
    } else {
      if (await bcrypt.compare(request.body.password, user.password)) {
        const userInfo = { username: request.body.username };
        const accessToken = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET);
        // response.json({ accessToken: accessToken });   *TESTS OK, NOW SETTING COOKIE IN RESPONSE._
        response
          .status(202)
          .cookie("userAccessToken", accessToken)
          .redirect(303, "/users/landing"); //redirect sends to landing.html
      } else {
        response.sendStatus(403).send({ status: "Password incorrect" });
      }
    }
  } catch (error) {
    console.log(error);
    response.status(500).send(error);
  }
});

// Setting up route/path to landing Page (ref. signIn() in index.js)
app.get("/users/landing", async (request, response) => {
  try {
    response.sendFile(path.join(__dirname + "/landing.html"));
  } catch (error) {
    response.status(500).send(error);
  }
});

//get request for blog posts (All at this point) - gets from database as JSON object
app.get("/blogPosts", authorizeUser, async (request, response) => {
  try {
    const blogPosts = await BlogPostModel.find({}).populate("username").exec();
    response.json(
      blogPosts.filter(
        (post) => post.username.username === request.user.username
      )
    );
  } catch (error) {
    response.status(500).send(error);
  }
});

//post request for blogpost
app.post("/blogPosts", async (request, response) => {
  try {
    console.log(request.body);
    const newBlog = new BlogPostModel(request.body);
    const createBlog = await BlogPostModel.create(newBlog);
    response.status(303).redirect("/users/landing");
  } catch (error) {
    response.status(500).send(error);
    console.log(error);
  }
});

//Logout
app.post("/logout", async (request, response) => {
  try {
    response.status(200).cookie("userAccessToken", "").redirect(303, "/");
  } catch (error) {
    response.status(500).send(error);
  }
});

//Middleware function - think functional (when going to page that requires user to be logged in)
function authorizeUser(request, response, next) {
  const authHeader = request.headers.authorization;
  const getToken = authHeader && authHeader.split(" ")[1]; //1st authHeader essentially asks if authheader bearer is null
  if (getToken === null) {
    return response.status(401).send("Invalid Token");
  }
  jwt.verify(getToken, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
    if (error) response.sendStatus(403); //shortened syntax - automatic return of response.sendStatus...
    request.user = user; //alters request with key called user, sets to user value.
    console.log(request.user);
    next(); //goes back to reg async request, updates request parameter with stored/verified user.
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
