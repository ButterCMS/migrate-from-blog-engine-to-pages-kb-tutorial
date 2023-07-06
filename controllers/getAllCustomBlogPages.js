const { fetchAllCustomBlogPages } = require("../lib/api");

// function to get all custom blog pages
module.exports = async (req, res) => {
  try {
    const pages = await fetchAllCustomBlogPages();
    res.status(200).json(pages);
  } catch (error) {
    console.log({
      error,
    });

    res.status(500).json({ error: error.message });
  }
};
