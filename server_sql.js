require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const sql = require("mysql2/promise");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const pool = sql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_UN,
  password: process.env.DB_PWD,
});

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

// app.get("/users", async (request, response) => {
//   let users = await UserModel.find({});
//   response.json(users);
// });

// app.get("/user", authorizeUser, async (request, response) => {
//   console.log(request.user);
//   let user = await UserModel.find({ username: request.user.username });
//   response.json(user);
// });
// //authorize w jwt
// //after authorize, pull username out of jwt

//SQL POST USER CREATE
app.post("/user", async (request, response) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPwd = await bcrypt.hash(request.body.password, salt);
    const con = await pool.getConnection();
    const result = await con.query(
      `INSERT INTO travelblog.users (username, password) VALUES ('${request.body.username}','${hashedPwd}')`
    );
    const userInfo = { username: request.body.username };
    const accessToken = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET);
    response
      .status(201)
      .cookie("blogAccessToken", accessToken)
      .redirect(303, "/users/landing");
  } catch (error) {
    response.status(500).send(error);
  }
});

//MYSQL2 SIGN IN
app.post("/users/login", async (request, response) => {
  try {
    const myQuery = `SELECT * FROM travelblog.users WHERE username = '${request.body.username}';`;
    const con = await pool.getConnection();
    const result = await con.query(myQuery);
    con.release();
    const hashedPwd = result[0][0].password;
    const pullingID = result[0][0].id;
    if (await bcrypt.compare(request.body.password, hashedPwd)) {
      const userInfo = { username: request.body.username, id: pullingID };
      const accessToken = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET);
      response
        .status(202)
        .cookie("blogAccessToken", accessToken)
        .redirect(303, "/users/landing");
    } else {
      response.sendStatus(403, "Incorrect Password");
    }
  } catch (error) {
    console.log(error);
    response.status(500).send(error);
  }
});

//SQL DELETE USER REQUEST

// Setting up route/path to landing Page (ref. signIn() in index.js)
app.get("/users/landing", async (request, response) => {
  try {
    response.sendFile(path.join(__dirname + "/landing.html"));
  } catch (error) {
    response.status(500).send(error);
  }
});

// MYSQL2 GET REQUEST FOR USERS' BLOGS
app.get("/blogPosts", authorizeUser, async (request, response) => {
  try {
    const userID = request.user.id;

    const testQuery = `SELECT * FROM travelblog.blogposts WHERE userId = ${userID};`;
    console.log(testQuery);

    const con = await pool.getConnection();
    const authorName = request.user.username;
    const userInfo = await con.query(
      `SELECT * FROM travelblog.blogposts WHERE userId = ${userID};`
    );
    response.status(200).send({ author: authorName, data: userInfo });
    await con.release();
  } catch (error) {
    console.log(error);
    response.status(500).send(error);
  }
});

// //get request for blog posts (All at this point) - gets from database as JSON object
// app.get("/blogPosts", authorizeUser, async (request, response) => {
//   try {
//     const blogPosts = await BlogPostModel.find({}).populate("username").exec();
//     response.json(
//       blogPosts.filter(
//         (post) => post.username.username === request.user.username
//       )
//     );
//   } catch (error) {
//     response.status(500).send(error);
//   }
// });

// SQL2 POST REQ FOR BLOGS
app.post("/blogPosts", authorizeUser, async (request, response) => {
  try {
    console.log(request.body);
    const con = await pool.getConnection();
    const userID = await con.query(
      `SELECT id FROM travelblog.users WHERE username = '${request.user.username}'`
    );
    // console.log(userID[0][0].id);
    const result = await con.query(
      `INSERT INTO travelblog.blogposts (userId, blogdate, title, blog) VALUES (${userID[0][0].id}, CURDATE(), '${request.body.title}','${request.body.blog}');`
    );
    response.status(201).send(result);
  } catch (error) {
    console.log(error);
    response.status(500).send(error);
  }
});

// app.post("/blogPosts", async (request, response) => {
//   try {
//     console.log(request.body);
//     const newBlog = new BlogPostModel(request.body);
//     const createBlog = await BlogPostModel.create(newBlog);
//     response.status(303).redirect("/users/landing");
//   } catch (error) {
//     response.status(500).send(error);
//     console.log(error);
//   }
// });

//Logout
app.post("/logout", async (request, response) => {
  try {
    response.status(200).cookie("blogAccessToken", "").redirect(303, "/");
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
