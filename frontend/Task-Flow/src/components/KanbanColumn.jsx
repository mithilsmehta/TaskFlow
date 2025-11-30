import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanTaskCard from './KanbanTaskCard';

const KanbanColumn = ({ id, title, tasks, color, borderColor, onTaskClick }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    return (
        <div className="flex-shrink-0 w-80">
            <div className={`rounded-lg border-2 ${borderColor} ${color} p-4 h-full min-h-[600px] transition-all ${isOver ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
                    <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-600">
                        {tasks.length}
                    </span>
                </div>

                {/* Tasks Container */}
                <div
                    ref={setNodeRef}
                    className="space-y-3 min-h-[500px]"
                >
                    <SortableContext
                        items={tasks.map(task => task._id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {tasks.length === 0 ? (
                            <div className="flex items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-lg">
                                <p className="text-gray-400 text-sm">Drop tasks here</p>
                            </div>
                        ) : (
                            tasks.map((task) => (
                                <KanbanTaskCard
                                    key={task._id}
                                    task={task}
                                    onTaskClick={onTaskClick}
                                />
                            ))
                        )}
                    </SortableContext>
                </div>
            </div>
        </div>
    );
};

export default KanbanColumn;
