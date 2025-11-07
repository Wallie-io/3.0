CREATE TABLE "images" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"original_filename" text NOT NULL,
	"total_storage_mb" numeric(10, 2) NOT NULL,
	"uploaded_at" timestamp DEFAULT now(),
	"message_id" text,
	"post_id" text,
	"r2_bucket_name" text NOT NULL,
	"thumbnail_key" text NOT NULL,
	"thumbnail_size_bytes" integer NOT NULL,
	"medium_key" text NOT NULL,
	"medium_size_bytes" integer NOT NULL,
	"large_key" text NOT NULL,
	"large_size_bytes" integer NOT NULL,
	"original_width" integer NOT NULL,
	"original_height" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_reply_to_id_posts_id_fk";
--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;