CREATE TABLE `nl_customer_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`use_reference` integer DEFAULT true NOT NULL,
	`use_placement` integer DEFAULT true NOT NULL,
	`use_batch` integer DEFAULT true NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
 
INSERT INTO `nl_customer_settings` (
	`customer_id`
) SELECT id FROM `nl_customer`;
