const generateBlogPage = require("./generateBlogPage");

// function to generate multiple blog pages
const generateBlogPages = async (posts) => {
  try {
    // generate blog pages
    const data = await Promise.all(
      posts.map(async (post) => {
        const generatedPost = await generateBlogPage(post);

        return generatedPost;
      })
    );

    return data;
  } catch (error) {
    console.log("generateBlogPages error =====>", error);
    return {
      error: error.message,
    };
  }
};

module.exports = generateBlogPages;
