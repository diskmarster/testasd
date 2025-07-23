CREATE TABLE `nl_announcement` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`active_until` integer DEFAULT (unixepoch() + 86400) NOT NULL
);--> statement-breakpoint

create unique index only_one_active
on nl_announcement (active)
where active = 1;
