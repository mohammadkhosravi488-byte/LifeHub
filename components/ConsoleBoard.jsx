"use client";
import DarkModeToggle from "@/components/DarkModeToggle";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";

/**
 * items: [{ id, spanLg?:1|2|3, height?:number, render: ({dragHandleProps}) => JSX }]
 * onReorder: (ids[]) => void
 */
export default function ConsoleBoard({ items, onReorder }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 }}));

  const ids = items.map(i => i.id);

  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    onReorder?.(newOrder);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <SortableItem key={it.id} id={it.id} spanLg={it.spanLg ?? 1}>
              {({ dragHandleProps }) => it.render({ dragHandleProps })}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id, spanLg = 1, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const colClass =
    spanLg === 3 ? "lg:col-span-3" :
    spanLg === 2 ? "lg:col-span-2" : "lg:col-span-1";

  return (
    <div ref={setNodeRef} style={style} className={colClass}>
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </div>
  );
}
