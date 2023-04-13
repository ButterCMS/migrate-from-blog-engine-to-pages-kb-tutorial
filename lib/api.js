const Butter = require("buttercms");
const dotenv = require("dotenv");
dotenv.config();

const butter = Butter(process.env.BUTTERCMS_READ_TOKEN);

// mapArr is an array of objects that matches the defined type to the key of the collection
// the type is defined from the request body
const DefaultMapArr = [
  { type: "tag", key: "blog_tag" },
  { type: "category", key: "blog_category" },
  { type: "author", key: "blog_author" },
];

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

// function to create multiple collections
const createBlogCollections = async ({
  mapArr = DefaultMapArr,
  collections = [
    {
      data: [
        {
          name,
          slug,
          description,
        },
      ],
      type,
    },
  ],
}) => {
  // console.log("createBlogCollections called =====>", {
  //   mapArr,
  //   collections,
  // });

  try {
    // map over the mapArr and create the collections
    const data = await Promise.all(
      mapArr.map(async ({ type, key }) => {
        // find the collection that matches the type
        const data = collections.find(
          (collection) => collection.type === type
        )?.data;

        if (!data) {
          return null;
        }

        // create the collection
        const resp = await Promise.all(
          data.map(async (collection) => {
            const resp = await createCollection({
              key,
              fields: {
                ...collection,
              },
            });

            return resp;
          })
        );

        // return the key and the data
        return { key, data: resp };
      })
    );

    return data;
  } catch (error) {
    console.log("createBlogCollections error =====>", error);

    return {
      error: error.message,
    };
  }
};

// funtion to get a custom blog page
const getCustomBlogPage = async (slug) => {
  try {
    const resp = await butter.page.retrieve("blog_page", slug);
    console.log("getCustomBlogPage =====>", slug, resp.data.data);
    return resp.data.data;
  } catch (error) {
    console.log("getCustomBlogPage error =====>", error);
    // console.log({
    //   error,
    // });
    return null;
  }
};

// function to create a custom blog page
const createCustomBlogPage = async (
  pageData = {
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
    const existingBlogPage = await getCustomBlogPage(pageData.slug);
    console.log("existingBlogPage =====>", pageData.slug, existingBlogPage);

    // if it does, throw an error and return the existing page
    if (existingBlogPage) {
      return {
        error: `Blog page already exists: ${pageData.slug}`,
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
      body: JSON.stringify(pageData),
    });

    const resData = await res.json();

    console.log("resData =====>", pageData.slug, resData);

    if (resData["status"] !== "pending" || resData[""])
      throw new Error(
        JSON.stringify({ slug: pageData.slug, data: resData[""] })
      );

    // fetch the page again to get the full data
    let blogPage = await getCustomBlogPage(pageData.slug);

    // if null fetch again after 1 second
    !blogPage && (await new Promise((resolve) => setTimeout(resolve, 1000)));
    blogPage = await getCustomBlogPage(pageData.slug);

    return {
      message: `Blog page created: ${pageData.slug}`,
      data: blogPage,
    };
  } catch (error) {
    console.log("createCustomBlogPage error =====>", error);
    return {
      error: error.message,
    };
  }
};

const migrateBlogPost = async (
  post = {
    status,
    created,
    updated,
    published,
    title,
    slug,
    body,
    summary,
    seo_title,
    meta_description,
    featured_image_alt,
    url,
    featured_image,
    author: {
      bio,
      slug,
      last_name,
      first_name,
    },
    tags: [{ name, slug }],
    categories: [{ name, slug }],
  }
) => {
  try {
    const authorData = post?.author && {
      name: `${post?.author?.first_name} ${post?.author?.last_name}`,
      slug: post?.author?.slug,
      description: post?.author?.bio,
    };

    const categoriesData = post?.categories?.map((category) => {
      return {
        name: category?.name,
        slug: category?.slug,
      };
    });

    const tagsData = post?.tags?.map((tag) => {
      return {
        name: tag?.name,
        slug: tag?.slug,
      };
    });

    const createdCollections = await createBlogCollections({
      collections: [
        {
          type: "author",
          data: authorData && [authorData],
        },
        {
          type: "category",
          data: categoriesData,
        },
        {
          type: "tag",
          data: tagsData,
        },
      ],
    });

    const createdCollectionsID = createdCollections.map((collection) => ({
      key: collection?.key,
      IDs: collection?.data.map((data) => data?.meta?.id),
    }));

    // console.log({
    //   createdCollections,
    //   createdCollectionsID,
    // });

    const authorID = createdCollectionsID.find(
      (collection) => collection?.key === "blog_author"
    )?.IDs[0];
    const categoryIDs = createdCollectionsID.find(
      (collection) => collection?.key === "blog_category"
    )?.IDs;
    const tagIDs = createdCollectionsID.find(
      (collection) => collection?.key === "blog_tag"
    )?.IDs;

    const newPageData = {
      "page-type": "blog_page",
      status: "published",
      title: post?.title,
      slug: post?.slug,
      fields: {
        blog_seo: {
          title: post?.seo_title,
          description: post?.meta_description,
          og_image: post?.featured_image,
          og_image_alt: post?.featured_image_alt,
        },
        title: post?.title,
        body: [
          {
            content_block: {
              content: post?.body,
            },
          },
        ],
        categories: categoryIDs,
        tags: tagIDs,
        author: authorID,
        summary: post?.summary,
        publish_date: post?.published,
      },
    };

    const customBlogPage = await createCustomBlogPage(newPageData);

    console.log({
      customBlogPage,
    });

    if (customBlogPage?.error && !customBlogPage?.data)
      throw new Error(customBlogPage?.error);

    return customBlogPage;
  } catch (error) {
    console.log("migrateBlogPost error =====>", error);
    return {
      error: error.message,
    };
  }
};

const migrateBlogPosts = async (posts) => {
  try {
    const data = await Promise.all(
      posts.map(async (post) => {
        const migratedPost = await migrateBlogPost(post);
        return migratedPost;
      })
    );

    console.log("migratedBlogPosts =====>", data);

    return data;
  } catch (error) {
    console.log("migrateBlogPosts error =====>", error);
    return {
      error: error.message,
    };
  }
};

// let a = {
//   status: "published",
//   created: "2023-04-10T16:14:21.970609Z",
//   updated: "2023-04-10T16:14:22.001785Z",
//   published: "2023-04-10T16:10:33.864000Z",
//   title: "Another example blog post",
//   slug: "another-example-blog-post",
//   body: "<h2>Introduction</h2>\n<p>Welcome to another example blog post! In this post, we'll be exploring a variety of topics, from the latest tech gadgets to the most interesting travel destinations. Whether you're looking for inspiration, entertainment, or just some good old-fashioned fun, we've got you covered.</p>\n<h2>Section 1: The Latest Tech Gadgets</h2>\n<p>If you're a tech enthusiast, you won't want to miss this section. We'll be taking a look at the newest smartphones, laptops, and other gadgets that are making waves in the tech world. From the iPhone 14 to the latest gaming laptops, we'll be covering it all.</p>\n<h2>Section 2: Delicious Recipes to Try</h2>\n<p>Are you a foodie? Then this section is for you. We've got some mouth-watering recipes that you simply have to try. From healthy salads to decadent desserts, there's something for everyone in this section.</p>",
//   summary:
//     "The article is divided into three sections and provides information and inspiration for readers who are interested in technology, food, and travel. The article aims to be informative and entertaining, offering something for everyone who reads it.",
//   seo_title: "Another example blog post",
//   meta_description:
//     "The article is divided into three sections and provides information and inspiration for readers who are interested in technology, food, and ",
//   featured_image_alt: "another example image",
//   url: "another-example-blog-post",
//   featured_image:
//     "https://d2wzhk7xhrnk1x.cloudfront.net/f9Sen4QQcyVHSDZzI75w_butter-blog-post.jpg",
//   author: {
//     bio: "",
//     slug: "miracle-onyenma",
//     email: "miracleficient@gmail.com",
//     title: "",
//     last_name: "Onyenma",
//     first_name: "Miracle",
//     facebook_url: "",
//     linkedin_url: "",
//     instagram_url: "",
//     pinterest_url: "",
//     profile_image:
//       "https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/3825a854-54be-4fa8-8705-d93c1f3d8083",
//     twitter_handle: "",
//   },
//   tags: [
//     {
//       name: "tech",
//       slug: "tech",
//     },
//     {
//       name: "food",
//       slug: "food",
//     },
//   ],
//   categories: [
//     {
//       name: "example",
//       slug: "example",
//     },
//   ],
// };

// let b = {
//   status: "published",
//   created: "2023-04-10T16:14:21.970609Z",
//   updated: "2023-04-10T16:14:22.001785Z",
//   published: "2023-04-10T16:10:33.864000Z",
//   title: "Another example blog post",
//   slug: "popopopo-blog-post",
//   body: "<h2>Introduction</h2>\n<p>Welcome to another example blog post! In this post, we'll be exploring a variety of topics, from the latest tech gadgets to the most interesting travel destinations. Whether you're looking for inspiration, entertainment, or just some good old-fashioned fun, we've got you covered.</p>\n<h2>Section 1: The Latest Tech Gadgets</h2>\n<p>If you're a tech enthusiast, you won't want to miss this section. We'll be taking a look at the newest smartphones, laptops, and other gadgets that are making waves in the tech world. From the iPhone 14 to the latest gaming laptops, we'll be covering it all.</p>\n<h2>Section 2: Delicious Recipes to Try</h2>\n<p>Are you a foodie? Then this section is for you. We've got some mouth-watering recipes that you simply have to try. From healthy salads to decadent desserts, there's something for everyone in this section.</p>",
//   summary:
//     "The article is divided into three sections and provides information and inspiration for readers who are interested in technology, food, and travel. The article aims to be informative and entertaining, offering something for everyone who reads it.",
//   seo_title: "Another example blog post",
//   meta_description:
//     "The article is divided into three sections and provides information and inspiration for readers who are interested in technology, food, and ",
//   featured_image_alt: "another example image",
//   url: "another-example-blog-post",
//   featured_image:
//     "https://d2wzhk7xhrnk1x.cloudfront.net/f9Sen4QQcyVHSDZzI75w_butter-blog-post.jpg",
//   author: {
//     bio: "",
//     slug: "miracle-onyenma",
//     email: "miracleficient@gmail.com",
//     title: "",
//     last_name: "Onyenma",
//     first_name: "Miracle",
//     facebook_url: "",
//     linkedin_url: "",
//     instagram_url: "",
//     pinterest_url: "",
//     profile_image:
//       "https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/3825a854-54be-4fa8-8705-d93c1f3d8083",
//     twitter_handle: "",
//   },
//   tags: [
//     {
//       name: "tech",
//       slug: "tech",
//     },
//     {
//       name: "food",
//       slug: "food",
//     },
//   ],
//   categories: [
//     {
//       name: "example",
//       slug: "example",
//     },
//   ],
// };
// // test
// migrateBlogPosts([a, b]);

// export the functions
module.exports = {
  DefaultMapArr,
  fetchAllBlogPosts,
  fetchAllCustomBlogPages,
  fetchCollection,
  createCollection,
  createBlogCollections,
  getCustomBlogPage,
  createCustomBlogPage,
  migrateBlogPost,
  migrateBlogPosts,
};
