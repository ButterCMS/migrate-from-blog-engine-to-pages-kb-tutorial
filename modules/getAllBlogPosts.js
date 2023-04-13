const { fetchAllBlogPosts } = require("../lib/api");

const getAllBlogPosts = async () => await fetchAllBlogPosts();

module.exports = getAllBlogPosts;
