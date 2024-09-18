CREATE TABLE `nl_reorder` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_id` text NOT NULL,
	`product_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`minimum` real NOT NULL,
	`ordered` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `nl_location`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `nl_product`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nl_reorder_product_id_location_id_customer_id_unique` ON `nl_reorder` (`product_id`,`location_id`,`customer_id`);