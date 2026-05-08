import ComposeWizard from "@/components/compose/compose-wizard";
import { Suspense } from "react";

export default function ComposePage() {
  return (
    <Suspense
      fallback={
        <div className="border-[1.5px] border-[#c8c4ba] bg-white px-4 py-8 text-sm text-[#5a5850]">
          Loading compose…
        </div>
      }
    >
      <ComposeWizard />
    </Suspense>
  );
}
