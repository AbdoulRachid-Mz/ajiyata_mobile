CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`firebase_uid` text,
	`provider` text NOT NULL,
	`device_id` text NOT NULL,
	`is_local` integer DEFAULT true NOT NULL,
	`is_synced` integer DEFAULT false NOT NULL,
	`biometric_enabled` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_login` integer NOT NULL,
	`last_sync` integer,
	`metadata` text DEFAULT '{}' NOT NULL
);
