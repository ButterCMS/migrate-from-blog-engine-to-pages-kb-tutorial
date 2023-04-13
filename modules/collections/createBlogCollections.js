// mapArr is an array of objects that matches the defined type to the key of the collection

const { createCollection } = require("../../lib/api");

// function to create multiple collections
const createBlogCollections = async ({
  collections = [
    {
      data: [
        {
          name,
          slug,
          description,
        },
      ],
      key,
    },
  ],
}) => {
  try {
    //
    const data = await Promise.all(
      collections.map(async ({ data, key }) => {
        // get the collection array data
        const collectionData = data;

        // if there is no collection data, return null
        if (!collectionData) {
          return {
            key,
            data: null,
          };
        }

        // create all the collection items
        const createdCollections = await Promise.all(
          collectionData.map(async (collection) => {
            // create a collection item
            const createdCollection = await createCollection({
              key,
              fields: collection,
            });

            return createdCollection;
          })
        );

        // return the created collections data
        return {
          key,
          data: createdCollections,
        };
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

module.exports = createBlogCollections;
