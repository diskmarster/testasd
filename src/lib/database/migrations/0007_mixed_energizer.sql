CREATE TABLE `nl_action_analytics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actionName` text NOT NULL,
	`user_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`session_id` text,
	`execution_time_ms` real NOT NULL,
	`platform` text NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `nl_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
