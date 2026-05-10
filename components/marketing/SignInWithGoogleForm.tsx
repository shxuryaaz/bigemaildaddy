"use client";

export function SignInWithGoogleForm({
  action,
}: {
  action: () => Promise<void>;
}) {
  return (
    <form action={action} className="mt-10">
      <button
        type="submit"
        className="w-full rounded-md bg-[#111010] py-4 text-[14px] font-medium text-[#faf8f4] transition-opacity hover:opacity-75 md:w-auto md:px-10"
        style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
      >
        Continue with Google →
      </button>
    </form>
  );
}
