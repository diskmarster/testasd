CREATE TABLE `nl_batch` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_id` text NOT NULL,
	`batch` text NOT NULL,
	`expiry` integer,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	`is_barred` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `nl_location`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nl_group` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`name` text NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	`is_barred` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nl_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`location_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`placement_id` integer NOT NULL,
	`batch_id` integer NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `nl_location`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nl_inventory` (
	`product_id` integer NOT NULL,
	`placement_id` integer NOT NULL,
	`batch_id` integer NOT NULL,
	`location_id` text NOT NULL,
	`customer_id` integer NOT NULL,
	`quantity` real DEFAULT 0 NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`product_id`, `placement_id`, `batch_id`, `location_id`, `customer_id`),
	FOREIGN KEY (`product_id`) REFERENCES `nl_product`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`placement_id`) REFERENCES `nl_placement`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batch_id`) REFERENCES `nl_batch`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`location_id`) REFERENCES `nl_location`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `nl_placement` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_id` text NOT NULL,
	`name` text NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	`is_barred` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `nl_location`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nl_product` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`group_id` integer NOT NULL,
	`unit_id` integer NOT NULL,
	`text_1` text NOT NULL,
	`text_2` text DEFAULT '' NOT NULL,
	`text_3` text DEFAULT '' NOT NULL,
	`sku` text NOT NULL,
	`barcode` text NOT NULL,
	`cost_price` real NOT NULL,
	`sales_price` real DEFAULT 0 NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	`is_barred` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `nl_group`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `nl_unit`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `nl_unit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	`is_barred` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nl_batch_location_id_batch_unique` ON `nl_batch` (`location_id`,`batch`);--> statement-breakpoint
CREATE UNIQUE INDEX `nl_group_customer_id_name_unique` ON `nl_group` (`customer_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `nl_placement_location_id_name_unique` ON `nl_placement` (`location_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `nl_product_customer_id_sku_unique` ON `nl_product` (`customer_id`,`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `nl_product_customer_id_barcode_unique` ON `nl_product` (`customer_id`,`barcode`);--> statement-breakpoint
CREATE UNIQUE INDEX `nl_unit_name_unique` ON `nl_unit` (`name`);