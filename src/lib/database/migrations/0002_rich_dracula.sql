CREATE TABLE `nl_reorder` (
	`location_id` text NOT NULL,
	`product_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`minimum` real NOT NULL,
	`ordered` real DEFAULT 0 NOT NULL,
	`buffer` real NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`product_id`, `location_id`, `customer_id`),
	FOREIGN KEY (`location_id`) REFERENCES `nl_location`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `nl_product`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
