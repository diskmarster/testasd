CREATE TABLE `nl_history_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`location_id` text NOT NULL,
	`user_id` integer,
	`user_name` text,
	`user_role` text,
	`product_id` integer,
	`product_group_name` text,
	`product_unit_name` text,
	`product_text_1` text,
	`product_text_2` text,
	`product_text_3` text,
	`product_sku` text,
	`product_barcode` text,
	`product_cost_price` real,
	`product_sales_price` real,
	`product_is_barred` integer,
	`placement_id` integer,
	`placement_name` text,
	`batch_id` integer,
	`batch_name` text,
	`type` text NOT NULL,
	`platform` text NOT NULL,
	`amount` real NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`inserted` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `nl_customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `nl_location`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

INSERT INTO nl_history_new (
  `customer_id`,
`location_id`,
`user_id`,
`user_name`,
`user_role`,
`product_id`,
`product_group_name`,
`product_unit_name`,
`product_text_1`,
`product_text_2`,
`product_text_3`,
`product_sku`,
`product_barcode`,
`product_cost_price`,
`product_sales_price`,
`product_is_barred`,
`placement_id`,
`placement_name`,
`batch_id`,
`batch_name`,
`type`,
`platform`,
`amount`,
`reference`,
`inserted`
)
SELECT 
  h.`customer_id`,
  h.`location_id`,
  h.`user_id`,
  u.name AS `user_name`,
  u.role AS `user_role`,
  h.`product_id`,
  pg.name AS `product_group_name`,
  pu.name AS `product_unit_name`,
  p.text_1 AS `product_text_1`,
  p.text_2 AS `product_text_2`,
  p.text_3 AS `product_text_3`,
  p.sku AS `product_sku`,
  p.barcode AS `product_barcode`,
  p.cost_price AS `product_cost_price`,
  p.sales_price AS `product_sales_price`,
  p.is_barred AS `product_is_barred`,
  h.`placement_id`,
  pl.name AS `placement_name`,
  h.`batch_id`,
  b.batch AS `batch_name`,
  h.`type`,
  h.`platform`,
  h.`amount`,
  h.`reference`,
  h.`inserted`
FROM nl_history AS h
  LEFT JOIN nl_user AS u ON u.id = h.user_id
  LEFT JOIN nl_product AS p ON p.id = h.product_id
    LEFT JOIN nl_group AS pg on pg.id = p.group_id
    LEFT JOIN nl_unit AS pu on pu.id = p.unit_id
  LEFT JOIN nl_placement AS pl ON pl.id = h.placement_id
  LEFT JOIN nl_batch AS b ON b.id = h.batch_id;
--> statement-breakpoint

DROP TABLE nl_history;
--> statement-breakpoint

ALTER TABLE nl_history_new RENAME TO nl_history;
