CREATE TABLE `nl_default_placement` (
	`product_id` integer NOT NULL,
	`placement_id` integer NOT NULL,
	`location_id` text NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`product_id`, `placement_id`, `location_id`),
	FOREIGN KEY (`product_id`) REFERENCES `nl_product`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`placement_id`) REFERENCES `nl_placement`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `nl_location`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nl_default_placement_product_id_location_id_unique` ON `nl_default_placement` (`product_id`,`location_id`);