CREATE TABLE `nl_attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`ref_domain` text NOT NULL,
	`type` text NOT NULL,
	`ref_id` integer NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`user_id` integer NOT NULL,
	`user_name` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
