CREATE TABLE `participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`presentation_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`nickname` text NOT NULL,
	`nickname_hidden` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`presentation_id`) REFERENCES `presentations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_presentation_participant_idx` ON `participants` (`presentation_id`,`participant_id`);--> statement-breakpoint
ALTER TABLE `questions` ADD `opened_at` integer;--> statement-breakpoint
ALTER TABLE `responses` ADD `score` integer;