import PostCreateButton from "./post-create-button"

const PostTableTitle = () => {
	return (
		<>
			<div className="mb-5 flex flex-row border-border border-b pb-5">
				<div className="flex-none items-center justify-start">
					<h1 className="font-semibold text-base text-foreground leading-6">
						Posts
					</h1>
					<p className="mt-2 text-muted text-sm">Manage your posts</p>
				</div>
				<div className="flex-grow" />
				<div className="flex-none items-center justify-end">
					<PostCreateButton />
				</div>
			</div>
		</>
	)
}

export default PostTableTitle
