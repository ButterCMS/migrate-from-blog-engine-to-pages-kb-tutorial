const createBlogCollections = require("../modules/collections/createBlogCollections");

// function to create blog collections
module.exports = async (req, res) => {
  try {
    const collections = req.body;

    const createdCollections = await createBlogCollections({ collections });

    res.status(200).json(createdCollections);
  } catch (error) {
    console.log({
      error,
    });

    res.status(500).json({ error: error.message });
  }
};
