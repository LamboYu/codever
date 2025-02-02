/* ****** Bookmarks ****** */
// delete old index
db.bookmarks.dropIndex("full_text_search");

//recreate index
db.bookmarks.createIndex(
  {
    name: "text",
    location: "text",
    description: "text",
    tags: "text",
    sourceCodeURL: "text",
  },
  {
    weights: {
      name: 13,
      location: 8,
      description: 5,
      tags: 21,
      sourceCodeURL: 3
    },
    name: "full_text_search",
    default_language: "none",
    language_override: "none"
  }
);

/* ****** Snippets ****** */
// delete old index
db.snippets.dropIndex("full_text_search");

//recreate


