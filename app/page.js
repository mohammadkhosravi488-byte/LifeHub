import AuthButtons from "@/components/AuthButtons";
import TodoList from "@/components/TodoList";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-6 w-full max-w-2xl p-6">
        <h1 className="text-4xl font-bold text-blue-600">Welcome to LifeHub 🎉</h1>
        <AuthButtons />
        <div className="w-full">
          <h2 className="text-xl font-semibold text-blue-600">Your To-Dos</h2>
          <TodoList />
        </div>
      </div>
    </main>
  );
}
