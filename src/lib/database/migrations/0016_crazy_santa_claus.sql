CREATE TABLE `nl_auth_provider` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`auth_id` text NOT NULL,
	`domain` text NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `nl_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nl_auth_provider_domain_user_id_unique` ON `nl_auth_provider` (`domain`,`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `nl_auth_provider_auth_id_unique` ON `nl_auth_provider` (`auth_id`);
--> statement-breakpoint

INSERT INTO nl_auth_provider ('user_id', 'auth_id', 'domain')
SELECT nl_user.id, nl_user.hash, "pw" FROM nl_user;
--> statement-breakpoint

INSERT INTO nl_auth_provider ('user_id', 'auth_id', 'domain')
SELECT nl_user.id, nl_user.pin, "pincode" FROM nl_user;
--> statement-breakpoint

UPDATE nl_auth_provider SET 'domain'='pin' WHERE  nl_auth_provider.domain='pincode';
--> statement-breakpoint

ALTER TABLE nl_user DROP COLUMN hash;
--> statement-breakpoint
ALTER TABLE nl_user DROP COLUMN pin;
