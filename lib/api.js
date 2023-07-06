const Butter = require("buttercms");
const dotenv = require("dotenv");
dotenv.config();

// initialize buttercms
const butter = Butter(process.env.BUTTERCMS_READ_TOKEN);

// fetch all blog posts
const fetchAllBlogPosts = async () => {
  const resp = await butter.post.list();
  return resp.data;
};

// fetch all custom blog pages
const fetchAllCustomBlogPages = async () => {
  const resp = await butter.page.list("blog_page");
  return resp.data;
};

// fetch a collection by key and slug
const fetchCollection = async ({ key, slug }) => {
  const resp = await butter.content.retrieve([key], {
    "fields.slug": slug,
  });

  const collection = resp.data.data[key];

  return collection && collection.length > 0 ? collection[0] : null;
};

// function to create a collection
const createCollection = async ({ key, fields }) => {
  // check if the collection already exists
  const existingCollection = await fetchCollection({ key, slug: fields.slug });

  // if it does, return it
  if (existingCollection) {
    console.log(`collection already exists: ${key} - ${fields.slug}`);
    return existingCollection;
  }

  // if it doesn't, create it
  const res = await fetch(`${process.env.BUTTERCMS_API_URL}/content/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${process.env.BUTTERCMS_WRITE_TOKEN}`,
    },
    body: JSON.stringify({
      key,
      status: "published",
      fields: [
        {
          ...fields,
        },
      ],
    }),
  });

  console.log(`new collection created: ${key} - ${fields.slug}`);

  // the response from the API which is simply the status or error
  const resData = await res.json();

  // fetch the collection again to get the full data
  const collection = await fetchCollection({ key, slug: fields.slug });

  // return the collection
  return collection;
};

// funtion to get a custom blog page
const getCustomBlogPage = async (slug) => {
  try {
    const resp = await butter.page.retrieve("blog_page", slug);
    return resp.data.data;
  } catch (error) {
    console.log("getCustomBlogPage error =====>", error.message);
    return null;
  }
};

// function to create a custom blog page
const createCustomBlogPage = async (
  blogPageData = {
    "page-type": (pageType = "blog_page"),
    status: "published",
    title,
    slug,
    fields: {
      blog_seo: {
        title,
        description,
        og_image,
        og_image_alt,
      },
      title,
      body: [
        {
          content_block: {
            content,
          },
        },
      ],
      categories,
      tags,
      author,
      summary,
      publish_date,
    },
  }
) => {
  try {
    // check if the page already exists
    const existingBlogPage = await getCustomBlogPage(blogPageData.slug);
    console.log("existingBlogPage =====>", blogPageData.slug, existingBlogPage);

    // if it does, throw an error and return the existing page
    if (existingBlogPage) {
      return {
        status: "existing",
        message: `Blog page already exists: ${blogPageData.slug}`,
        data: existingBlogPage,
      };
    }

    // if it doesn't, create it
    const res = await fetch(`${process.env.BUTTERCMS_API_URL}/pages/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.BUTTERCMS_WRITE_TOKEN}`,
      },
      body: JSON.stringify(blogPageData),
    });

    // the response from the API which is simply the status or error
    const resData = await res.json();

    // if the status is not pending or the data is empty, throw an error
    if (resData["status"] !== "pending" || resData[""])
      throw new Error(
        JSON.stringify({ slug: blogPageData.slug, data: resData[""] })
      );

    // fetch the page again to get the full data
    let blogPage = await getCustomBlogPage(blogPageData.slug);

    // if null fetch again after 1 second
    !blogPage && (await new Promise((resolve) => setTimeout(resolve, 1000)));
    blogPage = await getCustomBlogPage(blogPageData.slug);

    // return the page data and the status
    return {
      status: "created",
      message: `Blog page created: ${blogPageData.slug}`,
      data: blogPage,
    };
  } catch (error) {
    console.log("createCustomBlogPage error =====>", error);
    return {
      error: error.message,
    };
  }
};

// export the functions
module.exports = {
  fetchAllBlogPosts,
  fetchAllCustomBlogPages,
  fetchCollection,
  createCollection,
  getCustomBlogPage,
  createCustomBlogPage,
};
