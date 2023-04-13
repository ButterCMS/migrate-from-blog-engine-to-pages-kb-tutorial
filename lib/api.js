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
    return resp.data.data;
  } catch (error) {
    console.log("getCustomBlogPage error =====>", error.message);
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
        status: "existing",
        message: `Blog page already exists: ${pageData.slug}`,
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
      status: "created",
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

const generateBlogPost = async (
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

    console.log(
      "createdCollections =====>",
      createdCollections.map((collection) => ({
        key: collection?.key,
        data: collection?.data,
      }))
    );

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

    if (customBlogPage?.error && !customBlogPage?.data)
      throw new Error(customBlogPage?.error);

    return customBlogPage;
  } catch (error) {
    console.log("generateBlogPost error =====>", error);
    return {
      error: error.message,
    };
  }
};

const generateBlogPosts = async (posts) => {
  try {
    const data = await Promise.all(
      posts.map(async (post) => {
        const generatedPost = await generateBlogPost(post);
        return generatedPost;
      })
    );

    return data;
  } catch (error) {
    console.log("generateBlogPosts error =====>", error);
    return {
      error: error.message,
    };
  }
};

const migrateBlogPosts = async () => {
  try {
    // get all blog posts from buttercms
    const butterBlogPosts = await fetchAllBlogPosts();

    console.log(
      "Fetched blog posts from buttercms =====>",
      butterBlogPosts.data.map((post) => post.slug)
    );

    // generate custom blog pages from buttercms blog posts
    const generatedBlogPosts = await generateBlogPosts(butterBlogPosts.data);

    console.log(
      "Generated blog posts =====>",
      generatedBlogPosts.map((post) => post?.data?.slug)
    );

    return generatedBlogPosts;
  } catch (error) {
    console.log("migrateBlogPosts error =====>", error);

    return {
      error: error.message,
    };
  }
};

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
  generateBlogPost,
  generateBlogPosts,
  migrateBlogPosts,
};
