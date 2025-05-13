CREATE TABLE `nl_apikeys` (
	`key` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`customer_id` integer NOT NULL,
	`expiry` integer DEFAULT 'null',
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unq_name_customer` ON `nl_apikeys` (`name`,`customer_id`);