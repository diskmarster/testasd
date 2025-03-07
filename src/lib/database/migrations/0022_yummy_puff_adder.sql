ALTER TABLE `nl_reorder` ADD `order_amount` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `nl_reorder` ADD `max_order_amount` real DEFAULT 0 NOT NULL;--> statement-breakpoint

UPDATE `nl_reorder`
SET `order_amount` = `minimum` * `buffer`,
		`max_order_amount` = 0;--> statement-breakpoint

ALTER TABLE `nl_reorder` DROP COLUMN `buffer`;
