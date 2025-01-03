CREATE TYPE "public"."discoverySuggestionType" AS ENUM('discover', 'experience', 'share', 'learn', 'other');--> statement-breakpoint
CREATE TYPE "public"."entityType" AS ENUM('place', 'post', 'guide', 'discovery', 'experience', 'embedding', 'content', 'generic', 'event', 'research', 'other');--> statement-breakpoint
CREATE TYPE "public"."experienceType" AS ENUM('post', 'discover', 'experience');--> statement-breakpoint
CREATE TYPE "public"."postType" AS ENUM('general', 'article', 'collaboration', 'other');--> statement-breakpoint
CREATE TYPE "public"."PostVisibilityType" AS ENUM('public', 'private', 'followers', 'authenticated');--> statement-breakpoint
CREATE TYPE "public"."userType" AS ENUM('user', 'admin', 'system');--> statement-breakpoint
CREATE TABLE "account" (
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
CREATE TABLE "authenticator" (
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
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verificationNumberSessions" (
	"verificationNumber" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp NOT NULL,
	"title" text NOT NULL,
	"public" boolean DEFAULT false,
	"sharePath" text,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "docSuggestion" (
	"id" text NOT NULL,
	"documentId" text NOT NULL,
	"documentCreatedAt" timestamp NOT NULL,
	"originalText" text NOT NULL,
	"suggestedText" text NOT NULL,
	"description" text,
	"isResolved" boolean DEFAULT false NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "docSuggestion_id_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"userId" text NOT NULL,
	CONSTRAINT "document_id_createdAt_pk" PRIMARY KEY("id","createdAt")
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"chatId" text NOT NULL,
	"role" varchar NOT NULL,
	"content" json NOT NULL,
	"attachment" json DEFAULT '[]'::json,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vote" (
	"chatId" text NOT NULL,
	"messageId" text NOT NULL,
	"isUpvoted" boolean NOT NULL,
	CONSTRAINT "vote_chatId_messageId_pk" PRIMARY KEY("chatId","messageId")
);
--> statement-breakpoint
CREATE TABLE "resource" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"url" text DEFAULT '',
	"public" boolean DEFAULT false,
	"keywords" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"categories" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"note" text,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discoverySuggestion" (
	"id" text PRIMARY KEY NOT NULL,
	"genId" text,
	"title" text NOT NULL,
	"label" text NOT NULL,
	"suggestion" text NOT NULL,
	"type" "discoverySuggestionType" DEFAULT 'discover',
	"municipalities" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"activities" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"interests" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"public" boolean DEFAULT false,
	"meta" json DEFAULT '{}'::json,
	"userId" text
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"type" "entityType" DEFAULT 'content',
	"content" text NOT NULL,
	"contentHash" text,
	"description" text,
	"embedding" vector(1536),
	"model" text NOT NULL,
	"usage" text,
	"meta" json DEFAULT '{}'::json,
	"resourceId" varchar(191) NOT NULL,
	"userId" text NOT NULL,
	"chatId" text,
	"messageId" text,
	"placeId" text
);
--> statement-breakpoint
CREATE TABLE "experienceLikes" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" text,
	"experienceId" text,
	"promptId" text
);
--> statement-breakpoint
CREATE TABLE "experience" (
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
	"published" boolean DEFAULT true,
	"visibility" "PostVisibilityType" DEFAULT 'public' NOT NULL,
	"views" integer DEFAULT 0,
	"upVoted" integer DEFAULT 0,
	"pinned" boolean DEFAULT false,
	"staffPick" boolean DEFAULT false,
	"hideGeoLocation" boolean DEFAULT false,
	"location" text,
	"latitude" double precision,
	"longitude" double precision,
	"type" "entityType" DEFAULT 'experience',
	"subType" "experienceType" DEFAULT 'experience',
	"meta" json DEFAULT '{}'::json,
	"authorId" text,
	"embeddingsId" text,
	"kvStorageId" text,
	"promptId" text,
	"storyId" text
);
--> statement-breakpoint
CREATE TABLE "bookmark" (
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
CREATE TABLE "favorites" (
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"followedById" text NOT NULL,
	"followingId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audioMedia" (
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
CREATE TABLE "collaboratorMedia" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"collaboratorId" text,
	"mediaId" text
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"blobId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"semanticDescription" text,
	"url" text NOT NULL,
	"urlOriginal" text,
	"urlDownload" text,
	"alt" text,
	"caption" text,
	"credit" text,
	"creditLink" text,
	"creditLinkText" text,
	"language" text DEFAULT 'en',
	"order" integer DEFAULT 0,
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
	"tags" text[] DEFAULT ARRAY[]::text[],
	"focalLength" text,
	"focalLengthFormatted" text,
	"focalLength35" text,
	"focalLengthIn35MmFormatFormatted" text,
	"aperture" text,
	"iso" integer,
	"isoFormatted" text,
	"fNumber" integer,
	"fNumberFormatted" text,
	"lensMake" text,
	"lensModel" text,
	"exposureTime" text,
	"exposureTimeFormatted" text,
	"exposureCompensation" text,
	"exposureCompensationFormatted" text,
	"locationName" text,
	"latitude" double precision,
	"longitude" double precision,
	"filmSimulation" text,
	"priorityOrder" double precision,
	"takenAt" timestamp,
	"takenAtNaive" text,
	"takenAtNaiveFormatted" text,
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
CREATE TABLE "mediaLike" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" text,
	"mediaId" text
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" text PRIMARY KEY NOT NULL,
	"placeId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"shortDescription" text,
	"aliases" text[] DEFAULT ARRAY[]::text[] NOT NULL,
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
	"types" text[] DEFAULT ARRAY[]::text[] NOT NULL,
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
CREATE TABLE "post" (
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
	"type" "entityType" DEFAULT 'post',
	"embeddingsId" text
);
--> statement-breakpoint
CREATE TABLE "prompt" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"prompt" text NOT NULL,
	"location" text,
	"activities" text[] DEFAULT ARRAY[]::text[],
	"interests" text[] DEFAULT ARRAY[]::text[],
	"model" text,
	"pinned" boolean DEFAULT false,
	"featured" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"private" boolean DEFAULT false,
	"archived" boolean DEFAULT false,
	"viewCount" integer DEFAULT 0,
	"type" "userType" DEFAULT 'user',
	"meta" json DEFAULT '{}'::json,
	"authorId" text,
	"embeddingsId" text,
	"promptCollectionId" text
);
--> statement-breakpoint
CREATE TABLE "promptCollaborator" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"published" boolean DEFAULT true,
	"userId" text NOT NULL,
	"experienceId" text NOT NULL,
	"promptId" text NOT NULL,
	"storyId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promptCollection" (
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
CREATE TABLE "collaborator" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"active" boolean DEFAULT false,
	"blocked" boolean DEFAULT false,
	"meta" json DEFAULT '{}'::json,
	"userId" text
);
--> statement-breakpoint
CREATE TABLE "user" (
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
	"blog" text,
	"url" text,
	"urlSocial" text,
	"urlPay" text,
	"company" text,
	"organization" text,
	"profession" text,
	"investor" json[] DEFAULT '{}'::json[],
	"partner" json[] DEFAULT '{}'::json[],
	"interests" text[] DEFAULT ARRAY[]::text[] NOT NULL,
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
	"verified" boolean DEFAULT false,
	"meta" json DEFAULT '{}'::json
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verificationNumberSessions" ADD CONSTRAINT "verificationNumberSessions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "docSuggestion" ADD CONSTRAINT "docSuggestion_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "docSuggestion" ADD CONSTRAINT "docSuggestion_documentId_documentCreatedAt_document_id_createdAt_fk" FOREIGN KEY ("documentId","documentCreatedAt") REFERENCES "public"."document"("id","createdAt") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource" ADD CONSTRAINT "resource_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discoverySuggestion" ADD CONSTRAINT "discoverySuggestion_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_resourceId_resource_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_placeId_places_id_fk" FOREIGN KEY ("placeId") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experienceLikes" ADD CONSTRAINT "experienceLikes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experienceLikes" ADD CONSTRAINT "experienceLikes_experienceId_experience_id_fk" FOREIGN KEY ("experienceId") REFERENCES "public"."experience"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experienceLikes" ADD CONSTRAINT "experienceLikes_promptId_prompt_id_fk" FOREIGN KEY ("promptId") REFERENCES "public"."prompt"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience" ADD CONSTRAINT "experience_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience" ADD CONSTRAINT "experience_embeddingsId_embeddings_id_fk" FOREIGN KEY ("embeddingsId") REFERENCES "public"."embeddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience" ADD CONSTRAINT "experience_promptId_prompt_id_fk" FOREIGN KEY ("promptId") REFERENCES "public"."prompt"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience" ADD CONSTRAINT "experience_storyId_promptCollection_id_fk" FOREIGN KEY ("storyId") REFERENCES "public"."promptCollection"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_collaboratorId_collaborator_id_fk" FOREIGN KEY ("collaboratorId") REFERENCES "public"."collaborator"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_mediaId_media_id_fk" FOREIGN KEY ("mediaId") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_postId_post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_experienceId_experience_id_fk" FOREIGN KEY ("experienceId") REFERENCES "public"."experience"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_promptId_prompt_id_fk" FOREIGN KEY ("promptId") REFERENCES "public"."prompt"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audioMedia" ADD CONSTRAINT "audioMedia_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audioMedia" ADD CONSTRAINT "audioMedia_mediaId_media_id_fk" FOREIGN KEY ("mediaId") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audioMedia" ADD CONSTRAINT "audioMedia_experienceId_experience_id_fk" FOREIGN KEY ("experienceId") REFERENCES "public"."experience"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboratorMedia" ADD CONSTRAINT "collaboratorMedia_collaboratorId_collaborator_id_fk" FOREIGN KEY ("collaboratorId") REFERENCES "public"."collaborator"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboratorMedia" ADD CONSTRAINT "collaboratorMedia_mediaId_media_id_fk" FOREIGN KEY ("mediaId") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_postId_post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_chatMessageId_message_id_fk" FOREIGN KEY ("chatMessageId") REFERENCES "public"."message"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_experienceId_experience_id_fk" FOREIGN KEY ("experienceId") REFERENCES "public"."experience"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mediaLike" ADD CONSTRAINT "mediaLike_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mediaLike" ADD CONSTRAINT "mediaLike_mediaId_media_id_fk" FOREIGN KEY ("mediaId") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_embeddingsId_embeddings_id_fk" FOREIGN KEY ("embeddingsId") REFERENCES "public"."embeddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt" ADD CONSTRAINT "prompt_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt" ADD CONSTRAINT "prompt_embeddingsId_embeddings_id_fk" FOREIGN KEY ("embeddingsId") REFERENCES "public"."embeddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt" ADD CONSTRAINT "prompt_promptCollectionId_promptCollection_id_fk" FOREIGN KEY ("promptCollectionId") REFERENCES "public"."promptCollection"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promptCollaborator" ADD CONSTRAINT "promptCollaborator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promptCollaborator" ADD CONSTRAINT "promptCollaborator_experienceId_experience_id_fk" FOREIGN KEY ("experienceId") REFERENCES "public"."experience"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promptCollaborator" ADD CONSTRAINT "promptCollaborator_promptId_prompt_id_fk" FOREIGN KEY ("promptId") REFERENCES "public"."prompt"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promptCollaborator" ADD CONSTRAINT "promptCollaborator_storyId_promptCollection_id_fk" FOREIGN KEY ("storyId") REFERENCES "public"."promptCollection"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborator" ADD CONSTRAINT "collaborator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;