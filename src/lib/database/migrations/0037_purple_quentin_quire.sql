CREATE TABLE `nl_full_sync_cron_configs` (
	`integration_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`function_name` text NOT NULL,
	`function_arn` text NOT NULL,
	`schedule_name` text NOT NULL,
	`schedule_arn` text NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`customer_id`, `integration_id`),
	FOREIGN KEY (`integration_id`) REFERENCES `nl_customer_integrations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nl_full_sync_cron_configs_function_name_unique` ON `nl_full_sync_cron_configs` (`function_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `nl_full_sync_cron_configs_function_arn_unique` ON `nl_full_sync_cron_configs` (`function_arn`);--> statement-breakpoint
CREATE UNIQUE INDEX `nl_full_sync_cron_configs_schedule_name_unique` ON `nl_full_sync_cron_configs` (`schedule_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `nl_full_sync_cron_configs_schedule_arn_unique` ON `nl_full_sync_cron_configs` (`schedule_arn`);