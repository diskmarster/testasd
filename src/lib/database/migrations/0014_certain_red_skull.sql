CREATE TABLE `nl_errors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`type` text NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`input` text,
	`error` text DEFAULT '' NOT NULL,
	`origin` text NOT NULL
);
