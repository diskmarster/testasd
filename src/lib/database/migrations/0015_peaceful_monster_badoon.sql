ALTER TABLE `nl_reset_password` ADD `password_type` text DEFAULT 'pw' NOT NULL;--> statement-breakpoint
ALTER TABLE `nl_location` ADD `inserted` integer DEFAULT (unixepoch()) NOT NULL;--> statement-breakpoint
ALTER TABLE `nl_location` ADD `updated` integer DEFAULT (unixepoch()) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `nl_location_name_customer_id_unique` ON `nl_location` (`name`,`customer_id`);