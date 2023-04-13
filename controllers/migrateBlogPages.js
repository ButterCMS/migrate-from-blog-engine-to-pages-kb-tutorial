const { fetchAllBlogPosts } = require("../lib/api");
const generateBlogPages = require("../modules/blog-pages/generateBlogPages");

// function to migrate all buttercms blog posts to custom blog pages
module.exports = async (req, res) => {
  try {
    // get all blog posts from buttercms
    const butterBlogPosts = await fetchAllBlogPosts();

    // log the fetched blog posts
    console.log(
      "Fetched blog posts from buttercms =====>",
      butterBlogPosts.data.map((post) => post.slug)
    );

    // generate custom blog pages from buttercms blog posts
    const generatedBlogPages = await generateBlogPages(butterBlogPosts.data);

    // log the generated blog pages
    console.log(
      "Generated blog posts =====>",
      generatedBlogPages.map((post) => post?.data?.slug)
    );

    res.status(200).json(generatedBlogPages);
  } catch (error) {
    console.log("migrateBlogPages error =====>", error);

    res.status(500).json({ error: error.message });
  }
};
