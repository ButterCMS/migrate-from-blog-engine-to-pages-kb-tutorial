const generateBlogPages = require("../modules/blog-pages/generateBlogPages");

// function to generate multiple blog pages from buttercms blog posts
module.exports = async (req, res) => {
  try {
    const blogPosts = req.body;

    const generatedBlogPosts = await generateBlogPages(blogPosts);

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
};
