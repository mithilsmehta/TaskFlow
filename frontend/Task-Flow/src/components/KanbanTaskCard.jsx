import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LuPaperclip, LuCalendar, LuListChecks } from 'react-icons/lu';
import moment from 'moment';
import AvatarGroup from './AvatarGroup';

const KanbanTaskCard = ({ task, onTaskClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High':
                return 'bg-red-100 text-red-600 border-red-200';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-600 border-yellow-200';
            case 'Low':
                return 'bg-green-100 text-green-600 border-green-200';
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getDueDateColor = (dueDate) => {
        if (!dueDate) return 'text-gray-500';
        const now = moment();
        const due = moment(dueDate);
        const daysUntilDue = due.diff(now, 'days');

        if (daysUntilDue < 0) return 'text-red-600'; // Overdue
        if (daysUntilDue <= 2) return 'text-orange-600'; // Due soon
        return 'text-gray-600'; // Normal
    };

    const completedTodos = Array.isArray(task.todoChecklist)
        ? task.todoChecklist.filter(todo => todo.done).length
        : 0;
    const totalTodos = Array.isArray(task.todoChecklist) ? task.todoChecklist.length : 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`bg-white rounded-lg border border-gray-200 p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? 'shadow-2xl' : ''}`}
            onClick={(e) => {
                // Only trigger click if not dragging
                if (!isDragging && onTaskClick) {
                    onTaskClick(task);
                }
            }}
        >
            {/* Priority Badge */}
            <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                    {task.priority || 'Medium'}
                </span>
            </div>

            {/* Task Title */}
            <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                {task.title || 'Untitled Task'}
            </h4>

            {/* Task Description */}
            {task.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {task.description}
                </p>
            )}

            {/* Progress Bar */}
            {task.progress !== undefined && task.progress > 0 && (
                <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${task.progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Task Meta Info */}
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                {/* Checklist */}
                {totalTodos > 0 && (
                    <div className="flex items-center gap-1">
                        <LuListChecks className="text-sm" />
                        <span>{completedTodos}/{totalTodos}</span>
                    </div>
                )}

                {/* Attachments */}
                {task.attachmentCount > 0 && (
                    <div className="flex items-center gap-1">
                        <LuPaperclip className="text-sm" />
                        <span>{task.attachmentCount}</span>
                    </div>
                )}

                {/* Due Date */}
                {task.dueDate && (
                    <div className={`flex items-center gap-1 ${getDueDateColor(task.dueDate)}`}>
                        <LuCalendar className="text-sm" />
                        <span>{moment(task.dueDate).format('MMM D')}</span>
                    </div>
                )}
            </div>

            {/* Assigned Users */}
            {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 && (
                <div className="flex items-center justify-between">
                    <AvatarGroup
                        avatars={task.assignedTo.map(a => a.profileImageUrl || a).filter(Boolean)}
                        maxVisible={3}
                    />
                </div>
            )}
        </div>
    );
};

export default KanbanTaskCard;
