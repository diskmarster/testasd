CREATE TABLE `nl_order_lines` (
	`order_id` text NOT NULL,
	`location_id` text NOT NULL,
	`customer_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`supplier` text NOT NULL,
	`sku` text NOT NULL,
	`barcode` text NOT NULL,
	`text1` text NOT NULL,
	`text2` text NOT NULL,
	`unit_name` text NOT NULL,
	`cost_price` real NOT NULL,
	`quantity` real NOT NULL,
	`sum` real NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `nl_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `nl_location`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `nl_product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nl_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`user_name` text NOT NULL,
	`location_id` text NOT NULL,
	`customer_id` integer NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `nl_location`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
alter table `nl_attachments` rename column `ref_id` to `ref_id_old`;--> statement-breakpoint
alter table `nl_attachments` add `ref_id` text not null default "";--> statement-breakpoint
update `nl_attachments` set `ref_id` = cast(`ref_id_old` as text);--> statement-breakpoint
alter table `nl_attachments` drop column `ref_id_old`;--> statement-breakpoint
ALTER TABLE `nl_reorder` ADD `is_requested` integer DEFAULT false NOT NULL;
