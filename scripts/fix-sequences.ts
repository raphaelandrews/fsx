import "dotenv/config"
import { client } from "@/db"

async function fixSequences() {
	console.log("Fixing sequences...")

	await client`
		SELECT setval(
			pg_get_serial_sequence('link_groups', 'id'),
			COALESCE((SELECT MAX(id) FROM link_groups), 0) + 1,
			false
		)
	`
	console.log("Fixed link_groups sequence")

	await client`
		SELECT setval(
			pg_get_serial_sequence('links', 'id'),
			COALESCE((SELECT MAX(id) FROM links), 0) + 1,
			false
		)
	`
	console.log("Fixed links sequence")

	await client`
		SELECT setval(
			pg_get_serial_sequence('events', 'id'),
			COALESCE((SELECT MAX(id) FROM events), 0) + 1,
			false
		)
	`
	console.log("Fixed events sequence")

	console.log("Done!")
	process.exit(0)
}

fixSequences().catch((err) => {
	console.error("Error:", err)
	process.exit(1)
})
