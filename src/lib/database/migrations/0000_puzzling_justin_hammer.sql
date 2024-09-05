CREATE TABLE `nl_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `nl_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nl_user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`hash` text NOT NULL,
	`role` text DEFAULT 'bruger' NOT NULL,
	`customer_id` integer NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nl_customer_link` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` integer NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`location_id` text NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `nl_location`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nl_customer` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan` text NOT NULL,
	`company` text NOT NULL,
	`email` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nl_link_location_to_user` (
	`location_id` text NOT NULL,
	`user_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`user_id`, `location_id`),
	FOREIGN KEY (`location_id`) REFERENCES `nl_location`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `nl_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nl_location` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nl_user_email_unique` ON `nl_user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `nl_customer_email_unique` ON `nl_customer` (`email`);