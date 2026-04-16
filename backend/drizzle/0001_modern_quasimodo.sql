CREATE TABLE "signature_request_signers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"signing_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"signed_at" timestamp,
	"viewed_at" timestamp,
	"ip_address" varchar(45),
	"signed_doc_s3_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "signature_request_signers_signing_token_unique" UNIQUE("signing_token")
);
--> statement-breakpoint
ALTER TABLE "signature_request_signers" ADD CONSTRAINT "signature_request_signers_request_id_signature_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."signature_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sig_signers_request_id" ON "signature_request_signers" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_sig_signers_token" ON "signature_request_signers" USING btree ("signing_token");--> statement-breakpoint
CREATE INDEX "idx_sig_signers_email" ON "signature_request_signers" USING btree ("email");