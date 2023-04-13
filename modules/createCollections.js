const { createBlogCollections } = require("../lib/api");

const createCollections = async (data) => {
  const res = await createBlogCollections({
    collections: data,
  });

  if (res.error) {
    throw new Error(res.error);
  }

  return res;
};

module.exports = createCollections;
