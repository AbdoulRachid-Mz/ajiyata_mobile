CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`last_synced_at` integer,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`currency` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`last_synced_at` integer,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`account_id` text NOT NULL,
	`transaction_id` text,
	`type` text NOT NULL,
	`local_uri` text NOT NULL,
	`upload_url` text,
	`upload_id` text,
	`size` integer,
	`is_synced` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`last_synced_at` integer,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text NOT NULL,
	`limit` real NOT NULL,
	`spent` real DEFAULT 0 NOT NULL,
	`period` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`last_synced_at` integer,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`account_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`color` text NOT NULL,
	`icon` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`last_synced_at` integer,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`platform` text NOT NULL,
	`last_active_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`last_synced_at` integer,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`base_currency` text NOT NULL,
	`target_currency` text NOT NULL,
	`rate` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `saving_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`last_synced_at` integer,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`account_id` text NOT NULL,
	`title` text NOT NULL,
	`target_amount` real NOT NULL,
	`current_amount` real DEFAULT 0 NOT NULL,
	`deadline` integer,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`last_synced_at` integer,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`user_id` text NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`language` text NOT NULL,
	`currency` text NOT NULL,
	`biometric_enabled` integer DEFAULT false NOT NULL,
	`sync_enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sync_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`last_synced_at` integer,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`last_synced_at` integer,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`account_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text NOT NULL,
	`category_id` text,
	`note` text,
	`date` integer NOT NULL,
	`is_synced` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`last_synced_at` integer,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone_number` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`country` text,
	`language` text,
	`default_currency` text NOT NULL,
	`account_type` text NOT NULL,
	`is_synced` integer DEFAULT false NOT NULL
);
