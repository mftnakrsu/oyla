CREATE TABLE `presentations` (
	`id` text PRIMARY KEY NOT NULL,
	`join_code` text NOT NULL,
	`title` text NOT NULL,
	`admin_token_hash` text NOT NULL,
	`active_question_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_activity_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `presentations_join_code_unique` ON `presentations` (`join_code`);--> statement-breakpoint
CREATE INDEX `presentations_last_activity_idx` ON `presentations` (`last_activity_at`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`presentation_id` text NOT NULL,
	`position` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`config` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`presentation_id`) REFERENCES `presentations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `questions_presentation_idx` ON `questions` (`presentation_id`,`position`);--> statement-breakpoint
CREATE TABLE `responses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `responses_question_participant_idx` ON `responses` (`question_id`,`participant_id`);