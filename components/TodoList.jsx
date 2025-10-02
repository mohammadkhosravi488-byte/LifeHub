"use client";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { LifehubDataProvider } from "@/lib/data-context";
export default function TodoList({ todos = [], addTodo, toggleTodo, removeTodo }) {
  const [text, setText] = useState("");
  const [due, setDue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addTodo({ text, due: due ? new Date(due) : null });
    setText("");
    setDue("");
  };

  const visible = useMemo(() => todos, [todos]);

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task…"
          className="border px-3 py-2 rounded"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <button className="bg-indigo-600 text-white px-4 rounded">Add</button>
      </form>

      {visible.length === 0 ? (
        <p className="text-sm text-gray-500">No tasks yet.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((td) => (
            <li
              key={td.id}
              className="p-2 border rounded flex justify-between items-center"
            >
              <button
                className={`text-sm ${td.done ? "line-through text-gray-400" : ""}`}
                onClick={() => toggleTodo(td.id)}
              >
                {td.text}
              </button>
              <div className="flex gap-2 items-center">
                {td.due && (
                  <span className="text-xs text-gray-500">
                    Due {format(td.due, "MMM d, yyyy")}
                  </span>
                )}
                <button
                  className="text-red-500 text-xs"
                  onClick={() => removeTodo(td.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
