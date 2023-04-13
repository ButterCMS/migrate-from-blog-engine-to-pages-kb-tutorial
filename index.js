const express = require("express");
const dotenv = require("dotenv");
const getAllBlogPosts = require("./modules/getAllBlogPosts");
const getAllCustomBlogPages = require("./modules/getAllCustomBlogPages");
const createCollections = require("./modules/createCollections");
const { migrateBlogPosts, generateBlogPosts } = require("./lib/api");

const app = express();
dotenv.config();

const port = process.env.PORT || 4000;

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get("/", (req, res) => {
  res.json("Hi! to migrate blog posts, please use /migrateBlogPosts");
});

app.get("/getAllBlogPosts", async (req, res) => {
  const posts = await getAllBlogPosts();
  console.log({
    posts,
  });

  res.status(200).json(posts);
});

app.get("/getAllCustomBlogPages", async (req, res) => {
  const pages = await getAllCustomBlogPages();
  console.log({
    pages,
  });

  res.status(200).json(pages);
});

app.post("/createCollections", async (req, res) => {
  try {
    const { collections } = req.body;

    const createdCollections = await createCollections(collections);

    res.status(200).json(createdCollections);
  } catch (error) {
    console.log({
      error,
    });

    res.status(500).json({ error: error.message });
  }
});

app.post("/generateBlogPosts", async (req, res) => {
  try {
    const blogPosts = req.body;

    const generatedBlogPosts = await generateBlogPosts(blogPosts);

    console.log({
      generatedBlogPosts,
    });

    if (generatedBlogPosts.error) {
      throw new Error(generatedBlogPosts.error);
    }

    res.status(200).json(generatedBlogPosts);
  } catch (error) {
    console.log({
      error,
    });

    res.status(500).json({ error: error.message });
  }
});

app.post("/migrateBlogPosts", async (req, res) => {
  try {
    const migratedBlogPosts = await migrateBlogPosts();

    console.log({
      migratedBlogPosts,
    });

    if (migratedBlogPosts.error) {
      throw new Error(migratedBlogPosts.error);
    }

    res.status(200).json(migratedBlogPosts);
  } catch (error) {
    console.log({
      error,
    });

    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
