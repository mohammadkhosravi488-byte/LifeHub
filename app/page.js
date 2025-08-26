import AuthButtons from "@/components/AuthButtons";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold text-blue-600">Welcome to LifeHub 🎉</h1>
        <AuthButtons />
      </div>
    </main>
  );
}