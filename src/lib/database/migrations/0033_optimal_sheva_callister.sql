ALTER TABLE `nl_deleted_product` ADD `use_batch` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `nl_product` ADD `use_batch` integer DEFAULT false NOT NULL;
