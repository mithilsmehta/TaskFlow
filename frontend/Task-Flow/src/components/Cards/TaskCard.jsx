import React from "react";
import Progress from "../Progress";
import AvatarGroup from "../AvatarGroup";
import { LuPaperclip } from "react-icons/lu";
import moment from "moment";

const TaskCard = ({
    title = 'No Title',
    description = 'No description available',
    priority = 'Medium',
    status = 'Pending',
    progress: propProgress = 0,
    createdAt = new Date(),
    dueDate,
    assignedTo = [],
    attachmentCount = 0,
    completedTodoCount = 0,
    todoChecklist = [],
    onClick,
}) => {
    // Calculate progress based on todoChecklist if available, otherwise use propProgress or calculate from completedTodoCount
    const progress = todoChecklist.length > 0 
        ? Math.round((todoChecklist.filter(todo => todo.done).length / todoChecklist.length) * 100)
        : propProgress || (completedTodoCount > 0 ? Math.round((completedTodoCount / (completedTodoCount + (todoChecklist?.length || 1))) * 100) : 0);

    // Format dates
    const formattedCreatedAt = moment(createdAt).isValid() 
        ? moment(createdAt).format('Do MMM YYYY')
        : 'N/A';
        
    const formattedDueDate = dueDate && moment(dueDate).isValid()
        ? moment(dueDate).format('Do MMM YYYY')
        : 'No due date';
    const getStatusTagColor = () => {
        switch (status) {
            case "In Progress":
                return "text-cyan-500 bg-cyan-50 border border-cyan-500/10";

            case "Completed":
                return "text-lime-500 bg-lime-50 border border-lime-500/20";

            default:
                return "text-violet-500 bg-violet-50 border border-violet-500/10";
        }
    };

    const getPriorityTagColor = () => {
        switch (priority) {
            case "Low":
                return "text-emerald-500 bg-emerald-50 border border-emerald-500/10";

            case "Medium":
                return "text-amber-500 bg-amber-50 border border-amber-500/10";

            default:
                return "text-rose-500 bg-rose-50 border border-rose-500/10";
        }
    };

    return <div
        className="bg-white rounded-xl py-4 shadow-md shadow-gray-100 border border-gray-200/50 cursor-pointer"
        onClick={onClick}
    >
        <div className="flex items-end gap-3 px-4">
            <div
                className={`text-[11px] font-medium ${getStatusTagColor()} px-4 py-0.5 rounded `}
            >
                {status}
            </div>
            <div
                className={`text-[11px] font-medium ${getPriorityTagColor()} px-4 py-0.5 rounded`}
            >
                {priority} Priority
            </div>
        </div>

        <div
            className={`px-4 border-l-[3px] ${status === "In Progress"
                ? "border-cyan-500"
                : status === "Completed"
                    ? "border-indigo-500"
                    : "border-violet-500"
                }`}
        >
            <p className="text-sm font-medium text-gray-800 mt-4 line-clamp-2">
                {title}
            </p>

            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-[18px]">
                {description}
            </p>

            <div className="flex items-center justify-between mt-2 mb-2">
                <p className="text-[13px] text-gray-700/80 font-medium leading-[18px]">
                    Task Done:{" "}
                    <span className="font-semibold text-gray-700">
                        {todoChecklist.length > 0 
                            ? `${todoChecklist.filter(todo => todo.done).length} / ${todoChecklist.length}`
                            : completedTodoCount > 0 
                                ? `${completedTodoCount} tasks completed`
                                : 'No tasks'}
                    </span>
                </p>
                {attachmentCount > 0 && (
                    <div className="flex items-center text-xs text-gray-500">
                        <LuPaperclip className="mr-1" size={14} />
                        {attachmentCount}
                    </div>
                )}
            </div>

            <Progress progress={progress} status={status} />
        </div>

        <div className="px-4 mt-3">
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div>
                    <label className="text-xs text-gray-500">Start Date</label>
                    <p className="text-[13px] font-medium text-gray-900">
                        {formattedCreatedAt}
                    </p>
                </div>

                <div className="text-right">
                    <label className="text-xs text-gray-500">Due Date</label>
                    <p className={`text-[13px] font-medium ${dueDate && moment(dueDate).isBefore(moment(), 'day') ? 'text-red-500' : 'text-gray-900'}`}>
                        {formattedDueDate}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-3">
                <AvatarGroup avatars={assignedTo || []} />

                {attachmentCount > 0 && (
                    <div className="flex items-center gap-2 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                        <LuPaperclip className="text-primary" />{" "}
                        <span className="text-xs text-gray-900">{attachmentCount}</span>
                    </div>
                )}
            </div>
        </div>
    </div>
};

export default TaskCard;
