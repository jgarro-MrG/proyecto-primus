-- CreateTable
CREATE TABLE "public"."user_category_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "user_category_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_category_preferences_user_id_category_id_key" ON "public"."user_category_preferences"("user_id", "category_id");

-- AddForeignKey
ALTER TABLE "public"."user_category_preferences" ADD CONSTRAINT "user_category_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_category_preferences" ADD CONSTRAINT "user_category_preferences_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
