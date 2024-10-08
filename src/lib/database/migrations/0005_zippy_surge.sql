CREATE TABLE `nl_user_link` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` integer NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`location_ids` text NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `nl_location` ADD `is_barred` integer DEFAULT false NOT NULL;