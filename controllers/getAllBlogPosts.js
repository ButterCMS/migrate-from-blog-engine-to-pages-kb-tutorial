const { fetchAllBlogPosts } = require("../lib/api");

// function to get all buttercms blog posts
module.exports = async (req, res) => {
  try {
    const posts = await fetchAllBlogPosts();

    res.status(200).json(posts);
  } catch (error) {
    console.log({
      error,
    });

    res.status(500).json({ error: error.message });
  }
};
