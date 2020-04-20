const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema({
  username: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  postBody: {
    type: String,
    required: true,
  },
});

const BlogPostModel = mongoose.model("blogs", blogPostSchema);

module.exports = { BlogPostModel };
