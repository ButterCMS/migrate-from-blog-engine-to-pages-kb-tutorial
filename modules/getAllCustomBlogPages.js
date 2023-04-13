const { fetchAllCustomBlogPages } = require("../lib/api");

const getAllCustomBlogPages = async () => await fetchAllCustomBlogPages();

module.exports = getAllCustomBlogPages;
