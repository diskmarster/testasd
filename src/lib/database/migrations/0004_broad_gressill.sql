CREATE TABLE `nl_reset_password` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `nl_user`(`id`) ON UPDATE no action ON DELETE cascade
);
