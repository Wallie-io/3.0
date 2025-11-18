ALTER TABLE "posts" ALTER COLUMN "author_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "anonymous_author" text;