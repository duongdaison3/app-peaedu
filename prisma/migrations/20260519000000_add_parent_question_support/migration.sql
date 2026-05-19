-- Add parent_question_id column and foreign key
ALTER TABLE "questions" ADD COLUMN "parent_question_id" UUID;
ALTER TABLE "questions" ADD CONSTRAINT "questions_parent_question_id_fkey" FOREIGN KEY ("parent_question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
