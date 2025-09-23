ALTER TABLE `nl_customer_integration_settings` ADD `use_sync_suppliers` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `nl_customer_integration_settings` ADD `lamba_uploaded` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `nl_suppliers_history` ADD `integration_id` text;--> statement-breakpoint
ALTER TABLE `nl_suppliers` ADD `integration_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `customer_integration_id` ON `nl_suppliers` (`customer_id`,`integration_id`);