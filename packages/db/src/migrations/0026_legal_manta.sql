PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_circuit_podiums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`circuit_id` integer,
	`circuit_phase_id` integer,
	`category` text,
	`place` integer,
	`points` real NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`circuit_id`) REFERENCES `circuits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`circuit_phase_id`) REFERENCES `circuit_phases`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "circuit_podiums_target_check" CHECK(("__new_circuit_podiums"."circuit_id" IS NULL) <> ("__new_circuit_podiums"."circuit_phase_id" IS NULL)),
	CONSTRAINT "circuit_podiums_points_check" CHECK("__new_circuit_podiums"."points" BETWEEN 0 AND 1000000),
	CONSTRAINT "circuit_podiums_place_check" CHECK("__new_circuit_podiums"."place" IS NULL OR "__new_circuit_podiums"."place" BETWEEN 1 AND 1000),
	CONSTRAINT "circuit_podiums_category_check" CHECK("__new_circuit_podiums"."category" IS NULL OR "__new_circuit_podiums"."category" IN ('Sub 8 Masculino', 'Sub 10 Masculino', 'Sub 12 Masculino', 'Sub 14 Masculino', 'Sub 16 Masculino', 'Sub 18 Masculino', 'Sub 8 Feminino', 'Sub 10 Feminino', 'Sub 12 Feminino', 'Sub 14 Feminino', 'Sub 16 Feminino', 'Sub 18 Feminino', 'Futuro', 'Juvenil', 'Master'))
);
--> statement-breakpoint
INSERT INTO `__new_circuit_podiums`("id", "player_id", "circuit_id", "circuit_phase_id", "category", "place", "points", "created_at", "updated_at") SELECT "id", "player_id", "circuit_id", "circuit_phase_id", "category", "place", "points", "created_at", "updated_at" FROM `circuit_podiums`;--> statement-breakpoint
DROP TABLE `circuit_podiums`;--> statement-breakpoint
ALTER TABLE `__new_circuit_podiums` RENAME TO `circuit_podiums`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `circuit_podiums_circuit_phase_idx` ON `circuit_podiums` (`circuit_phase_id`);--> statement-breakpoint
CREATE INDEX `circuit_podiums_circuit_idx` ON `circuit_podiums` (`circuit_id`);