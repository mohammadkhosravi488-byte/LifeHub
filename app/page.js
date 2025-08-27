import AuthButtons from "@/components/AuthButtons";
import TodoList from "@/components/TodoList";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold text-indigo-700 tracking-tight">
          Welcome to LifeHub 🎉
        </h1>

        <AuthButtons />

        <div className="w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            Your To-Dos
          </h2>
          <TodoList />
        </div>
      </div>
    </main>
  );
}
