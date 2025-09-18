CREATE TABLE `nl_customer_integration_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`integration_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`use_sync_products` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `nl_customer_integrations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nl_customer_integration_settings_integration_id_unique` ON `nl_customer_integration_settings` (`integration_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `nl_customer_integration_settings_customer_id_unique` ON `nl_customer_integration_settings` (`customer_id`);--> statement-breakpoint
CREATE TABLE `nl_customer_integrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`provider` text NOT NULL,
	`config` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unq_provider_customer_id` ON `nl_customer_integrations` (`provider`,`customer_id`);