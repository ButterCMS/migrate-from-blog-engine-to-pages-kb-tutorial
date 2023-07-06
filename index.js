const express = require("express");
const dotenv = require("dotenv");
const getAllBlogPosts = require("./controllers/getAllBlogPosts");
const getAllCustomBlogPages = require("./controllers/getAllCustomBlogPages");
const createBlogCollections = require("./controllers/createBlogCollections");
const generateBlogPages = require("./controllers/generateBlogPages");
const migrateBlogPages = require("./controllers/migrateBlogPages");

const app = express();
dotenv.config();

const port = process.env.PORT || 4000;

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get("/", (req, res) => {
  res.json("Hi! to migrate blog posts, please use /migrateBlogPosts");
});

app.get("/getAllBlogPosts", getAllBlogPosts);

app.get("/getAllBlogPages", getAllCustomBlogPages);

app.post("/createCollections", createBlogCollections);

app.post("/generateBlogPages", generateBlogPages);

app.post("/migrateBlogPosts", migrateBlogPages);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
