interface Props {
	label: string
	icon?: React.ReactNode
}

const Title = ({ label, icon }: Props) => {
	return (
		<div className="flex items-center gap-2 text-primary">
			{icon}
			<h1 className="font-semibold">{label}</h1>
		</div>
	)
}

export default Title
