CREATE TABLE `circuit_categories` (
	`circuit_id` integer NOT NULL,
	`category` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	PRIMARY KEY(`circuit_id`, `category`),
	FOREIGN KEY (`circuit_id`) REFERENCES `circuits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category`) REFERENCES `categories`(`name`) ON UPDATE cascade ON DELETE restrict
);

--> statement-breakpoint
INSERT OR IGNORE INTO `circuit_categories` (`circuit_id`, `category`)
SELECT ph.`circuit_id`, r.`category` FROM `circuit_results` r JOIN `circuit_phases` ph ON ph.`id` = r.`circuit_phase_id` WHERE r.`category` IS NOT NULL
UNION SELECT r.`circuit_id`, r.`category` FROM `circuit_results` r WHERE r.`circuit_id` IS NOT NULL AND r.`category` IS NOT NULL
UNION SELECT `circuit_id`, `category` FROM `circuit_final_podiums` WHERE `category` IS NOT NULL;
