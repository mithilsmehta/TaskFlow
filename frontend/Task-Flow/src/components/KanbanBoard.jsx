import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import TaskCard from './Cards/TaskCard';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';
import toast from 'react-hot-toast';

const KanbanBoard = ({ tasks, onTaskUpdate, onTaskClick }) => {
    const [activeId, setActiveId] = useState(null);
    const [columns, setColumns] = useState({
        Pending: [],
        'In Progress': [],
        Completed: []
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Organize tasks into columns
    useEffect(() => {
        // Safety check: ensure tasks is an array
        const safeTasks = Array.isArray(tasks) ? tasks : [];

        const organized = {
            Pending: safeTasks.filter(t => t && t.status === 'Pending'),
            'In Progress': safeTasks.filter(t => t && t.status === 'In Progress'),
            Completed: safeTasks.filter(t => t && t.status === 'Completed')
        };
        setColumns(organized);
    }, [tasks]);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        // Find which column the active item is in
        const activeColumn = findColumn(activeId);
        // Find which column the over item is in (or if it's a column itself)
        const overColumn = findColumn(overId) || overId;

        if (!activeColumn || !overColumn) return;

        if (activeColumn !== overColumn) {
            setColumns((prev) => {
                const activeItems = Array.isArray(prev[activeColumn]) ? prev[activeColumn] : [];
                const overItems = Array.isArray(prev[overColumn]) ? prev[overColumn] : [];

                const activeIndex = activeItems.findIndex(item => item && item._id === activeId);
                const overIndex = overItems.findIndex(item => item && item._id === overId);

                // Safety check
                if (activeIndex === -1) return prev;

                let newIndex;
                if (overId in prev) {
                    // Dropping on a column
                    newIndex = overItems.length;
                } else {
                    // Dropping on an item
                    newIndex = overIndex >= 0 ? overIndex : overItems.length;
                }

                return {
                    ...prev,
                    [activeColumn]: activeItems.filter(item => item && item._id !== activeId),
                    [overColumn]: [
                        ...overItems.slice(0, newIndex),
                        activeItems[activeIndex],
                        ...overItems.slice(newIndex)
                    ]
                };
            });
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id;
        const overId = over.id;

        const activeColumn = findColumn(activeId);
        const overColumn = findColumn(overId) || overId;

        if (!activeColumn || !overColumn) {
            setActiveId(null);
            return;
        }

        // Update task status in backend
        if (activeColumn !== overColumn) {
            const task = findTask(activeId);
            if (task) {
                try {
                    // Prepare update data based on new status
                    const updateData = {
                        status: overColumn
                    };

                    // Auto-update progress and checklist based on status
                    if (overColumn === 'In Progress') {
                        // Set progress to 50% when moved to In Progress
                        updateData.progress = 50;

                        // Auto-check first 3 checklist items if they exist
                        if (Array.isArray(task.todoChecklist) && task.todoChecklist.length > 0) {
                            updateData.todoChecklist = task.todoChecklist.map((item, index) => ({
                                ...item,
                                done: index < 3 ? true : item.done
                            }));
                        }
                    } else if (overColumn === 'Completed') {
                        // Set progress to 100% when moved to Completed
                        updateData.progress = 100;

                        // Mark all checklist items as done
                        if (Array.isArray(task.todoChecklist) && task.todoChecklist.length > 0) {
                            updateData.todoChecklist = task.todoChecklist.map(item => ({
                                ...item,
                                done: true
                            }));
                        }
                    }

                    await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(task._id), updateData);

                    toast.success(`Task moved to ${overColumn}`);

                    // Notify parent to refresh
                    if (onTaskUpdate) {
                        onTaskUpdate();
                    }
                } catch (error) {
                    console.error('Error updating task status:', error);
                    toast.error('Failed to update task status');

                    // Revert the change
                    setColumns((prev) => {
                        const overItems = prev[overColumn];
                        const activeItems = prev[activeColumn];

                        return {
                            ...prev,
                            [overColumn]: overItems.filter(item => item._id !== activeId),
                            [activeColumn]: [...activeItems, task]
                        };
                    });
                }
            }
        }

        setActiveId(null);
    };

    const findColumn = (id) => {
        if (id in columns) {
            return id;
        }

        return Object.keys(columns).find((key) => {
            return columns[key].some(item => item._id === id);
        });
    };

    const findTask = (id) => {
        for (const column of Object.values(columns)) {
            const task = column.find(item => item._id === id);
            if (task) return task;
        }
        return null;
    };

    const activeTask = activeId ? findTask(activeId) : null;

    const columnConfig = [
        { id: 'Pending', title: 'Pending', color: 'bg-yellow-100', borderColor: 'border-yellow-300' },
        { id: 'In Progress', title: 'In Progress', color: 'bg-blue-100', borderColor: 'border-blue-300' },
        { id: 'Completed', title: 'Completed', color: 'bg-green-100', borderColor: 'border-green-300' }
    ];

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4">
                {columnConfig.map((config) => (
                    <KanbanColumn
                        key={config.id}
                        id={config.id}
                        title={config.title}
                        tasks={columns[config.id]}
                        color={config.color}
                        borderColor={config.borderColor}
                        onTaskClick={onTaskClick}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <div className="opacity-80 rotate-3 cursor-grabbing">
                        <TaskCard
                            title={activeTask.title || 'Untitled Task'}
                            description={activeTask.description || 'No description available'}
                            priority={activeTask.priority || 'Medium'}
                            status={activeTask.status || 'Pending'}
                            progress={activeTask.progress || 0}
                            createdAt={activeTask.createdAt || new Date()}
                            dueDate={activeTask.dueDate}
                            assignedTo={Array.isArray(activeTask.assignedTo)
                                ? activeTask.assignedTo.map(a => a.profileImageUrl).filter(Boolean)
                                : []}
                            attachmentCount={Array.isArray(activeTask.attachments) ? activeTask.attachments.length : 0}
                            completedTodoCount={Array.isArray(activeTask.todoChecklist)
                                ? activeTask.todoChecklist.filter(todo => todo.done).length
                                : 0}
                            todoChecklist={Array.isArray(activeTask.todoChecklist) ? activeTask.todoChecklist : []}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
