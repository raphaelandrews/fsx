"use client"

import PostCreateButton from "./post-create-button"

const PostTableEmpty = () => {
	return (
		<>
			<main className="grid min-h-full place-items-center rounded-lg border-2 border-gray-300 border-dashed bg-white px-6 py-24 sm:py-32 lg:px-8">
				<div className="text-center">
					<h1 className="mt-4 font-bold text-3xl text-gray-900 tracking-tight sm:text-5xl">
						Empty
					</h1>
					<p className="mt-6 text-base text-gray-600 leading-7">
						No posts to display.
					</p>
					<div className="mt-10 flex items-center justify-center gap-x-6">
						<PostCreateButton />
					</div>
				</div>
			</main>
		</>
	)
}

export default PostTableEmpty
