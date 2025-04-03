import { Link } from "@tanstack/react-router";

import type { PostCardType } from "@/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PostCard = ({ id, image, title }: PostCardType) => {
  return (
    <Link to="/posts/$postId" params={{ postId: id }}>
      <Card className="flex flex-col gap-2 p-0 border-none shadow-none bg-transparent">
        <CardHeader className="p-0 gap-0 rounded-lg overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full mx-auto transition-opacity duration-300"
          />
        </CardHeader>
        <CardContent className="p-0">
          <CardTitle className="font-normal leading-5 line-clamp-2 webkit-line-clamp-2">
            {title}
          </CardTitle>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PostCard;
