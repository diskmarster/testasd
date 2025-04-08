ALTER TABLE `nl_customer_settings` ALTER COLUMN "use_reference" TO "use_reference" text NOT NULL DEFAULT '{"tilgang":true,"afgang":true,"regulering":true,"flyt":true}'; 
--> statement-breakpoint

UPDATE `nl_customer_settings` AS new
SET `use_reference` = json_object(
	'tilgang', (
		SELECT old.use_reference 
		FROM `nl_customer_settings` AS old
		WHERE old.id = new.id
	),
	'afgang', (
		SELECT old.use_reference 
		FROM `nl_customer_settings` AS old
		WHERE old.id = new.id
	),
	'regulering', (
		SELECT old.use_reference 
		FROM `nl_customer_settings` AS old
		WHERE old.id = new.id
	),
	'flyt', (
		SELECT old.use_reference 
		FROM `nl_customer_settings` AS old
		WHERE old.id = new.id
	)
)
WHERE new.use_reference IN (0, 1)
