-- AlterTable
ALTER TABLE "procurements" ADD COLUMN "evaluation_criteria" JSONB;
ALTER TABLE "evaluator_reviews" ADD COLUMN "criterion_scores" JSONB;
