import axios from "redaxios";
import type { PostCardType } from "@/types";

import { API_BASE } from "@/lib/utils";

export class PostNotFoundError extends Error {}

export const fetchPost = async (postId: string) => {
  console.info(`Fetching post with id ${postId}...`);
  const post = await axios
    .get<PostCardType>(`http://localhost:3000/api/posts/${postId}`)
    .then((r) => r.data)
    .catch((err) => {
      if (err.status === 404) {
        throw new PostNotFoundError(`Post with id "${postId}" not found!`);
      }
      throw err;
    });

  return post;
};

export const fetchPosts = async () => {
  console.info("Fetching posts...");
  return axios
    .get<Array<PostCardType>>("http://localhost:3000/api/posts/last-posts")
    .then((r) => r.data);
};