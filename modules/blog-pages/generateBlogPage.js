const { createCustomBlogPage } = require("../../lib/api");
const createBlogCollections = require("../collections/createBlogCollections");

// function to generate a custom blog page from blog post data
const generateBlogPage = async (
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
    // get the author, categories and tags
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

    // create the collections
    const createdCollections = await createBlogCollections({
      collections: [
        {
          key: "blog_author",
          data: authorData && [authorData],
        },
        {
          key: "blog_category",
          data: categoriesData,
        },
        {
          key: "blog_tag",
          data: tagsData,
        },
      ],
    });

    // get the IDs of the created collections
    const createdCollectionsID = createdCollections.map((collection) => ({
      key: collection?.key,
      IDs: collection?.data.map((data) => data?.meta?.id),
    }));

    // // log the created collections
    // console.log(
    //   "createdCollections =====>",
    //   createdCollections.map((collection) => ({
    //     key: collection?.key,
    //     data: collection?.data,
    //   }))
    // );

    // get meta IDs from the colelction array
    const authorID = createdCollectionsID.find(
      (collection) => collection?.key === "blog_author"
    )?.IDs[0];
    const categoryIDs = createdCollectionsID.find(
      (collection) => collection?.key === "blog_category"
    )?.IDs;
    const tagIDs = createdCollectionsID.find(
      (collection) => collection?.key === "blog_tag"
    )?.IDs;

    //  create page data object for `createCustomBlogPage` payload
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

    // create and get the custom blog page
    const customBlogPage = await createCustomBlogPage(newPageData);

    // throw error if an error occurs or data is null
    if (customBlogPage?.error && !customBlogPage?.data)
      throw new Error(customBlogPage?.error);

    return customBlogPage;
  } catch (error) {
    console.log("generateBlogPage error =====>", error);
    return {
      error: error.message,
    };
  }
};

module.exports = generateBlogPage;
