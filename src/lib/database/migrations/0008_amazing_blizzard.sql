DROP INDEX IF EXISTS `nl_product_customer_id_sku_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `nl_product_customer_id_barcode_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `nl_product_customer_id_barcode_sku_unique` ON `nl_product` (`customer_id`,`barcode`,`sku`);