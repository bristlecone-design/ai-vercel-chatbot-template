CREATE TYPE "public"."ChatRole" AS ENUM('system', 'user', 'assistant', 'tool');--> statement-breakpoint
CREATE TYPE "public"."EntityType" AS ENUM('place', 'post', 'guide', 'discovery', 'experience', 'embedding', 'content', 'generic', 'event', 'research', 'other');--> statement-breakpoint
CREATE TYPE "public"."ExperienceType" AS ENUM('post', 'discover', 'experience');--> statement-breakpoint
CREATE TYPE "public"."PostType" AS ENUM('general', 'article', 'collaboration', 'other');--> statement-breakpoint
CREATE TYPE "public"."PostVisibilityType" AS ENUM('public', 'private', 'followers', 'authenticated');--> statement-breakpoint
CREATE TYPE "public"."UserType" AS ENUM('user', 'admin', 'system');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AudioMedia" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"model" text NOT NULL,
	"language" text DEFAULT 'en',
	"voice" text,
	"userId" text,
	"mediaId" text,
	"experienceId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Authenticator" (
	"id" text PRIMARY KEY NOT NULL,
	"credentialId" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Bookmark" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" text,
	"collaboratorId" text,
	"mediaId" text,
	"postId" text,
	"experienceId" text,
	"promptId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Chat" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp NOT NULL,
	"title" text NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "CollaboratorMedia" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"collaboratorId" text,
	"mediaId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Collaborator" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"active" boolean DEFAULT false,
	"blocked" boolean DEFAULT false,
	"meta" json DEFAULT '{}'::json,
	"userId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "DocSuggestion" (
	"id" text NOT NULL,
	"documentId" text NOT NULL,
	"documentCreatedAt" timestamp NOT NULL,
	"originalText" text NOT NULL,
	"suggestedText" text NOT NULL,
	"description" text,
	"isResolved" boolean DEFAULT false NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "DocSuggestion_id_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Document" (
	"id" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"userId" text NOT NULL,
	CONSTRAINT "Document_id_createdAt_pk" PRIMARY KEY("id","createdAt")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Embeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"type" "EntityType" DEFAULT 'content',
	"title" text NOT NULL,
	"url" text DEFAULT '',
	"text" text NOT NULL,
	"description" text NOT NULL,
	"note" text NOT NULL,
	"embedding" vector(1536),
	"keywords" text[] DEFAULT '{}'::text[] NOT NULL,
	"model" text NOT NULL,
	"usage" text NOT NULL,
	"meta" json DEFAULT '{}'::json,
	"chatId" text NOT NULL,
	"userId" text NOT NULL,
	"placeId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ExperienceLikes" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" text,
	"experienceId" text,
	"promptId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Experience" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"pinnedAt" timestamp,
	"title" text,
	"name" text,
	"content" text NOT NULL,
	"richContent" text,
	"description" text,
	"prompt" text,
	"ctas" json DEFAULT '{}'::json,
	"sharePath" text,
	"public" boolean DEFAULT false,
	"blocked" boolean DEFAULT false,
	"removed" boolean DEFAULT false,
	"visibility" "PostVisibilityType" DEFAULT 'public',
	"views" integer DEFAULT 0,
	"upVoted" integer DEFAULT 0,
	"pinned" boolean DEFAULT false,
	"staffPick" boolean DEFAULT false,
	"hideGeoLocation" boolean DEFAULT false,
	"location" text,
	"latitude" integer,
	"longitude" integer,
	"type" "EntityType" DEFAULT 'experience',
	"subType" "ExperienceType" DEFAULT 'experience',
	"meta" json DEFAULT '{}'::json,
	"authorId" text,
	"embeddingsId" text,
	"kvStorageId" text,
	"promptId" text,
	"storyId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Favorites" (
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Follows" (
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"followedById" text NOT NULL,
	"followingId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Media" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"urlOriginal" text,
	"urlDownload" text,
	"alt" text,
	"caption" text,
	"credit" text,
	"creditLink" text,
	"creditLinkText" text,
	"language" text DEFAULT 'en',
	"staffPick" boolean DEFAULT false,
	"featured" boolean DEFAULT false,
	"hidden" boolean DEFAULT false,
	"public" boolean DEFAULT true,
	"pinned" boolean DEFAULT false,
	"removed" boolean DEFAULT false,
	"downloadable" boolean DEFAULT true,
	"remixable" boolean DEFAULT true,
	"price" real,
	"forSale" boolean DEFAULT false,
	"forLicense" boolean DEFAULT false,
	"purchaseNotes" text,
	"usageNotes" text,
	"extension" text,
	"aspectRatio" real,
	"make" text,
	"model" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"focalLength" text,
	"focalLength35" text,
	"aperture" text,
	"iso" integer,
	"fNumber" integer,
	"lensMake" text,
	"lensModel" text,
	"exposureTime" text,
	"exposureCompensation" text,
	"locationName" text,
	"latitude" double precision,
	"longitude" double precision,
	"filmSimulation" text,
	"priorityOrder" double precision,
	"takenAt" timestamp,
	"takenAtNaive" text,
	"blurData" text,
	"meta" json DEFAULT '{}'::json,
	"storagePath" text,
	"isTTS" boolean DEFAULT false,
	"userId" text,
	"postId" text,
	"chatMessageId" text,
	"experienceId" text,
	"originalUrl" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "MediaLike" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" text,
	"mediaId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Message" (
	"id" text PRIMARY KEY NOT NULL,
	"chatId" text NOT NULL,
	"role" varchar NOT NULL,
	"content" json NOT NULL,
	"attachment" json DEFAULT '[]'::json,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Places" (
	"id" text PRIMARY KEY NOT NULL,
	"placeId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"shortDescription" text,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"address" text,
	"formattedAddress" text,
	"formattedAddressShort" text,
	"formattedPhoneNumber" text,
	"addressHtml" text,
	"addressComponents" json[] DEFAULT '{}'::json[] NOT NULL,
	"city" text,
	"state" text,
	"icon" text,
	"iconBackgroundColor" text,
	"iconMaskBaseUri" text,
	"reference" text,
	"location" text,
	"vicinity" text,
	"rating" text,
	"userRatingsTotal" integer,
	"utcOffset" integer,
	"permanentlyClosed" boolean,
	"businessStatus" text,
	"types" text[] DEFAULT '{}'::text[] NOT NULL,
	"primaryType" text,
	"openingHours" json,
	"priceLevel" text,
	"reviews" json[] DEFAULT '{}'::json[] NOT NULL,
	"geometry" json,
	"coordinates" json,
	"viewPort" json,
	"evChargeOpts" json,
	"parkingOpts" json,
	"plusCode" json,
	"photo" json,
	"photos" json[] DEFAULT '{}'::json[] NOT NULL,
	"url" text,
	"website" text,
	"meta" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Post" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"title" text,
	"content" text,
	"pinned" boolean DEFAULT false,
	"viewCount" integer DEFAULT 0,
	"location" text,
	"latitude" integer,
	"longitude" integer,
	"public" boolean DEFAULT true,
	"published" boolean DEFAULT false,
	"visibility" "PostVisibilityType" DEFAULT 'public',
	"blocked" boolean DEFAULT false,
	"authorId" text,
	"type" "EntityType" DEFAULT 'post',
	"embeddingsId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Prompt" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"prompt" text NOT NULL,
	"location" text,
	"activities" text[] DEFAULT '{}'::text[] NOT NULL,
	"interests" text[] DEFAULT '{}'::text[] NOT NULL,
	"model" text NOT NULL,
	"pinned" boolean DEFAULT false,
	"featured" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"private" boolean DEFAULT false,
	"archived" boolean DEFAULT false,
	"viewCount" integer DEFAULT 0,
	"type" "UserType" DEFAULT 'user',
	"meta" json DEFAULT '{}'::json,
	"authorId" text,
	"embeddingsId" text,
	"promptCollectionId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PromptCollaborator" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"published" boolean DEFAULT true,
	"userId" text,
	"experienceId" text,
	"promptId" text,
	"storyId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PromptCollection" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"path" text NOT NULL,
	"description" text,
	"shortDescription" text,
	"banner" text,
	"logo" text,
	"website" text,
	"videoUrl" text,
	"videoCaption" text,
	"featured" boolean DEFAULT false,
	"pinned" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"meta" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"blocked" boolean DEFAULT false,
	"active" boolean DEFAULT false,
	"allowed" boolean DEFAULT false,
	"enabled" boolean DEFAULT false,
	"waitlist" boolean DEFAULT true,
	"privateBeta" boolean DEFAULT false,
	"public" boolean DEFAULT true,
	"logins" integer DEFAULT 0,
	"role" varchar(16) DEFAULT 'user' NOT NULL,
	"email" varchar(64) NOT NULL,
	"emailVerified" timestamp,
	"password" varchar(64),
	"salt" varchar(64),
	"username" text,
	"name" text,
	"givenName" text,
	"familyName" text,
	"bio" text,
	"url" text,
	"urlSocial" text,
	"urlPay" text,
	"company" text,
	"organization" text,
	"profession" text,
	"interests" text[] DEFAULT '{}'::text[] NOT NULL,
	"image" text,
	"picture" text,
	"avatar" text,
	"banner" text,
	"location" text,
	"hireable" boolean DEFAULT false,
	"address" text,
	"phoneVerified" boolean DEFAULT false,
	"onboarded" boolean DEFAULT false,
	"followerCount" integer DEFAULT 0,
	"meta" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "VerificationNumberSessions" (
	"verificationNumber" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "VerificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Vote" (
	"chatId" text NOT NULL,
	"messageId" text NOT NULL,
	"isUpvoted" boolean NOT NULL,
	CONSTRAINT "Vote_chatId_messageId_pk" PRIMARY KEY("chatId","messageId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AudioMedia" ADD CONSTRAINT "AudioMedia_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AudioMedia" ADD CONSTRAINT "AudioMedia_mediaId_Media_id_fk" FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AudioMedia" ADD CONSTRAINT "AudioMedia_experienceId_Experience_id_fk" FOREIGN KEY ("experienceId") REFERENCES "public"."Experience"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_collaboratorId_Collaborator_id_fk" FOREIGN KEY ("collaboratorId") REFERENCES "public"."Collaborator"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_mediaId_Media_id_fk" FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_experienceId_Experience_id_fk" FOREIGN KEY ("experienceId") REFERENCES "public"."Experience"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_promptId_Prompt_id_fk" FOREIGN KEY ("promptId") REFERENCES "public"."Prompt"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CollaboratorMedia" ADD CONSTRAINT "CollaboratorMedia_collaboratorId_Collaborator_id_fk" FOREIGN KEY ("collaboratorId") REFERENCES "public"."Collaborator"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CollaboratorMedia" ADD CONSTRAINT "CollaboratorMedia_mediaId_Media_id_fk" FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "DocSuggestion" ADD CONSTRAINT "DocSuggestion_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "DocSuggestion" ADD CONSTRAINT "DocSuggestion_documentId_documentCreatedAt_Document_id_createdAt_fk" FOREIGN KEY ("documentId","documentCreatedAt") REFERENCES "public"."Document"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Embeddings" ADD CONSTRAINT "Embeddings_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Embeddings" ADD CONSTRAINT "Embeddings_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Embeddings" ADD CONSTRAINT "Embeddings_placeId_Places_id_fk" FOREIGN KEY ("placeId") REFERENCES "public"."Places"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ExperienceLikes" ADD CONSTRAINT "ExperienceLikes_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ExperienceLikes" ADD CONSTRAINT "ExperienceLikes_experienceId_Experience_id_fk" FOREIGN KEY ("experienceId") REFERENCES "public"."Experience"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ExperienceLikes" ADD CONSTRAINT "ExperienceLikes_promptId_Prompt_id_fk" FOREIGN KEY ("promptId") REFERENCES "public"."Prompt"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Experience" ADD CONSTRAINT "Experience_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Experience" ADD CONSTRAINT "Experience_embeddingsId_Embeddings_id_fk" FOREIGN KEY ("embeddingsId") REFERENCES "public"."Embeddings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Experience" ADD CONSTRAINT "Experience_promptId_Prompt_id_fk" FOREIGN KEY ("promptId") REFERENCES "public"."Prompt"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Experience" ADD CONSTRAINT "Experience_storyId_PromptCollection_id_fk" FOREIGN KEY ("storyId") REFERENCES "public"."PromptCollection"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Favorites" ADD CONSTRAINT "Favorites_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Media" ADD CONSTRAINT "Media_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Media" ADD CONSTRAINT "Media_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Media" ADD CONSTRAINT "Media_chatMessageId_Message_id_fk" FOREIGN KEY ("chatMessageId") REFERENCES "public"."Message"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Media" ADD CONSTRAINT "Media_experienceId_Experience_id_fk" FOREIGN KEY ("experienceId") REFERENCES "public"."Experience"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "MediaLike" ADD CONSTRAINT "MediaLike_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "MediaLike" ADD CONSTRAINT "MediaLike_mediaId_Media_id_fk" FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Post" ADD CONSTRAINT "Post_embeddingsId_Embeddings_id_fk" FOREIGN KEY ("embeddingsId") REFERENCES "public"."Embeddings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Prompt" ADD CONSTRAINT "Prompt_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Prompt" ADD CONSTRAINT "Prompt_embeddingsId_Embeddings_id_fk" FOREIGN KEY ("embeddingsId") REFERENCES "public"."Embeddings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Prompt" ADD CONSTRAINT "Prompt_promptCollectionId_PromptCollection_id_fk" FOREIGN KEY ("promptCollectionId") REFERENCES "public"."PromptCollection"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PromptCollaborator" ADD CONSTRAINT "PromptCollaborator_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PromptCollaborator" ADD CONSTRAINT "PromptCollaborator_experienceId_Experience_id_fk" FOREIGN KEY ("experienceId") REFERENCES "public"."Experience"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PromptCollaborator" ADD CONSTRAINT "PromptCollaborator_promptId_Prompt_id_fk" FOREIGN KEY ("promptId") REFERENCES "public"."Prompt"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PromptCollaborator" ADD CONSTRAINT "PromptCollaborator_storyId_PromptCollection_id_fk" FOREIGN KEY ("storyId") REFERENCES "public"."PromptCollection"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "VerificationNumberSessions" ADD CONSTRAINT "VerificationNumberSessions_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote" ADD CONSTRAINT "Vote_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote" ADD CONSTRAINT "Vote_messageId_Message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
