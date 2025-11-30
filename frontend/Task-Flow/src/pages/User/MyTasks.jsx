import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuFileSpreadsheet, LuLayoutGrid, LuList } from "react-icons/lu";
import TaskStatusTabs from "../../components/TaskStatusTabs";
import TaskCard from "../../components/Cards/TaskCard";
import KanbanBoard from "../../components/KanbanBoard";
import toast from "react-hot-toast";

const MyTasks = () => {
    const [allTasks, setAllTasks] = useState([]);
    const [tabs, setTabs] = useState([]);
    const [filterStatus, setFilterStatus] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "kanban"

    const navigate = useNavigate();

    const getAllTasks = async () => {
        try {
            // For Kanban view, get all tasks. For Grid view, filter by status
            const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
                params: {
                    status: (viewMode === "kanban" || filterStatus === "All") ? "" : filterStatus,
                },
            });

            setAllTasks(response.data?.tasks?.length > 0 ? response.data.tasks : []);

            // Map statusSummary data with fixed labels and order
            const statusSummary = response.data?.statusSummary || {};

            const statusArray = [
                { label: "All", count: statusSummary.all || 0 },
                { label: "Pending", count: statusSummary.pendingTasks || 0 },
                { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
                { label: "Completed", count: statusSummary.completedTasks || 0 },
            ];

            setTabs(statusArray);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleClick = async (taskData) => {
        const taskId = typeof taskData === 'string' ? taskData : taskData._id;

        // Auto-update to "In Progress" if task is clicked and status is "Pending"
        if (taskData.status === "Pending") {
            try {
                await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(taskId), {
                    status: "In Progress"
                });
                toast.success("Task moved to In Progress");
                // Refresh tasks
                getAllTasks();
            } catch (error) {
                console.error("Error updating task status:", error);
            }
        }

        navigate(`/user/task-details/${taskId}`);
    };

    useEffect(() => {
        getAllTasks();
        return () => { };
    }, [filterStatus, viewMode]);

    return (
        <DashboardLayout activeMenu="My Tasks">
            <div className="my-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                    <h2 className="text-xl md:text-xl font-medium">My Tasks</h2>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* View Toggle */}
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${viewMode === "grid"
                                        ? "bg-white text-primary shadow-sm"
                                        : "text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                <LuLayoutGrid className="text-lg" />
                                <span className="text-sm font-medium">Grid</span>
                            </button>
                            <button
                                onClick={() => setViewMode("kanban")}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${viewMode === "kanban"
                                        ? "bg-white text-primary shadow-sm"
                                        : "text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                <LuList className="text-lg" />
                                <span className="text-sm font-medium">Kanban</span>
                            </button>
                        </div>

                        {/* Status Tabs - Only show in grid view */}
                        {viewMode === "grid" && tabs?.[0]?.count > 0 && (
                            <TaskStatusTabs
                                tabs={tabs}
                                activeTab={filterStatus}
                                setActiveTab={setFilterStatus}
                            />
                        )}
                    </div>
                </div>

                {/* Grid View */}
                {viewMode === "grid" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {allTasks?.map((item, index) => (
                            <TaskCard
                                key={item._id}
                                title={item.title}
                                description={item.description}
                                priority={item.priority}
                                status={item.status}
                                progress={item.progress}
                                createdAt={item.createdAt}
                                dueDate={item.dueDate}
                                assignedTo={item.assignedTo?.map((item) => item.profileImageUrl)}
                                attachmentCount={item.attachments?.length || 0}
                                completedTodoCount={item.completedTodoCount || 0}
                                todoChecklist={item.todoChecklist || []}
                                onClick={() => {
                                    handleClick(item);
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Kanban View */}
                {viewMode === "kanban" && (
                    <div className="mt-4">
                        {allTasks.length > 0 ? (
                            <KanbanBoard
                                tasks={allTasks}
                                onTaskUpdate={getAllTasks}
                                onTaskClick={handleClick}
                            />
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-10">No tasks found</p>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MyTasks;
