CREATE TABLE IF NOT EXISTS "Follows" (
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"followedById" text NOT NULL,
	"followingId" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "urlSocial" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "urlPay" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "organization" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "followerCount" integer DEFAULT 0;