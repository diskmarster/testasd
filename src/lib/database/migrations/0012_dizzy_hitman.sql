ALTER TABLE `nl_user` ADD `web_access` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `nl_user` ADD `app_access` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `nl_user` ADD `price_access` integer DEFAULT true NOT NULL;