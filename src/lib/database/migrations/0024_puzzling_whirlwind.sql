CREATE TABLE `nl_customer_mail_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`location_id` text NOT NULL,
	`user_id` integer,
	`email` text,
	`send_stock_mail` integer DEFAULT false,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `nl_location`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `nl_user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "email_check" CHECK(("nl_customer_mail_settings"."user_id" IS NULL AND "nl_customer_mail_settings"."email" IS NOT NULL) OR ("nl_customer_mail_settings"."user_id" IS NOT NULL AND "nl_customer_mail_settings"."email" IS NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unq` ON `nl_customer_mail_settings` (`customer_id`,`location_id`,ifnull(`user_id`, 0),ifnull(`email`, 0));
