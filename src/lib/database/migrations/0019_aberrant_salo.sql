CREATE TABLE IF NOT EXISTS `nl_suppliers_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`supplier_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`user_id` integer NOT NULL,
	`user_name` text NOT NULL,
	`name` text NOT NULL,
	`id_of_client` text DEFAULT '' NOT NULL,
	`country` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`contact_person` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `nl_suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	`user_id` integer NOT NULL,
	`user_name` text NOT NULL,
	`name` text NOT NULL,
	`id_of_client` text DEFAULT '' NOT NULL,
	`country` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`contact_person` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `nl_product` ADD `supplier_id` integer REFERENCES nl_suppliers(id);
