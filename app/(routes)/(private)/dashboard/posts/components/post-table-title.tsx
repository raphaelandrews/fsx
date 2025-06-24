import PostCreateButton from "./post-create-button";

const PostTableTitle = () => {
  return (
    <>
      <div className="mb-5 flex flex-row border-b border-border pb-5">
        <div className="flex-none items-center justify-start">
          <h1 className="text-base font-semibold leading-6 text-foreground">
            Posts
          </h1>
          <p className="mt-2 text-sm text-muted">Manage your posts</p>
        </div>
        <div className="flex-grow" />
        <div className="flex-none items-center justify-end">
          <PostCreateButton />
        </div>
      </div>
    </>
  );
};

export default PostTableTitle;
