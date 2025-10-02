
import { LifehubDataProvider } from "@/lib/data-context";

export default function LeftRail(){
  return (
    <aside
      className="hidden xl:block"
      aria-label="Left rail"
      style={{width:60}}
    >
      <div className="mt-6 ml-6">
        <button
          className="w-11 h-11 rounded-[12px] bg-white border border-[var(--outline-neutral)] shadow-sm
                     hover:shadow-md grid place-items-center"
          title="Add console"
          aria-label="Add console"
        >+</button>
      </div>
    </aside>
  );
}
