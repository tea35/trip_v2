import { Suspense } from "react";
import { typographyStyles, globalTextSizes } from "@/styles/typography";
import CreateGroupForm from "./components/CreateGroupForm";

export default function CreateGroupPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className={typographyStyles.pageTitle}>グループ作成</h1>
        <p className={`${globalTextSizes.body} text-gray-600 mt-2`}>
          新しいグループを作成して、メンバーと旅行のチェックリストを共有しましょう
        </p>
      </div>
      
      <Suspense fallback={<div className={globalTextSizes.body}>読み込み中...</div>}>
        <CreateGroupForm />
      </Suspense>
    </div>
  );
}
