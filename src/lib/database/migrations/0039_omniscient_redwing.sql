CREATE TABLE `nl_integration_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`integration_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`status` text NOT NULL,
	`message` text NOT NULL,
	`event` text NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `nl_customer_integrations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE no action
);
