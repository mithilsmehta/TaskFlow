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

const ManageTasks = () => {
    const [allTasks, setAllTasks] = useState([]);
    const [tabs, setTabs] = useState([]);
    const [filterStatus, setFilterStatus] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "kanban"

    const navigate = useNavigate();

    const getAllTasks = async () => {
        try {
            // First, get all tasks without filtering
            const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);

            if (!response.data || !Array.isArray(response.data.tasks)) {
                console.error("Invalid response format:", response.data);
                toast.error("Failed to load tasks: Invalid response format");
                return;
            }

            const allTasksData = response.data.tasks;

            // For Kanban view, show all tasks. For Grid view, filter by status
            const tasksToShow = viewMode === "kanban" || filterStatus === "All"
                ? allTasksData
                : allTasksData.filter(task => task.status === filterStatus);

            setAllTasks(tasksToShow);

            // Calculate counts from all tasks, not just the filtered ones
            const statusSummary = {
                all: allTasksData.length,
                pendingTasks: allTasksData.filter(t => t.status === "Pending").length,
                inProgressTasks: allTasksData.filter(t => t.status === "In Progress").length,
                completedTasks: allTasksData.filter(t => t.status === "Completed").length,
            };

            const statusArray = [
                { label: "All", count: statusSummary.all },
                { label: "Pending", count: statusSummary.pendingTasks },
                { label: "In Progress", count: statusSummary.inProgressTasks },
                { label: "Completed", count: statusSummary.completedTasks },
            ];

            setTabs(statusArray);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            toast.error("Failed to load tasks");
        }
    };

    const handleClick = async (taskData) => {
        // Auto-update to "In Progress" if task is clicked and status is "Pending"
        if (taskData.status === "Pending") {
            try {
                await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(taskData._id), {
                    status: "In Progress"
                });
                toast.success("Task moved to In Progress");
                // Refresh tasks
                getAllTasks();
            } catch (error) {
                console.error("Error updating task status:", error);
            }
        }

        // Navigate to update task page with return URL
        navigate(`/admin/update-task/${taskData._id}`, {
            state: { from: '/admin/tasks' }
        });
    };

    // download task report
    const handleDownloadReport = async () => {
        try {
            const response = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_TASKS, {
                responseType: "blob",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            });

            // Check if we got a valid response
            if (!response.data) {
                throw new Error('No data received from server');
            }

            const contentDisposition = response.headers['content-disposition'];
            const filename = contentDisposition
                ? contentDisposition.split('filename=')[1].replace(/"/g, '')
                : `task_report_${new Date().toISOString().split('T')[0]}.xlsx`;

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            setTimeout(() => {
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            toast.success("Report downloaded successfully!");
        } catch (error) {
            console.error("Error downloading report:", error);
            toast.error(error.response?.data?.message || "Failed to download report. Please try again.");
        }
    };

    useEffect(() => {
        getAllTasks();
    }, [filterStatus, viewMode]);

    return (
        <DashboardLayout activeMenu="Manage Tasks">
            <div className="my-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl md:text-xl font-medium">My Tasks</h2>

                        <button
                            className="flex lg:hidden download-btn"
                            onClick={handleDownloadReport}
                        >
                            <LuFileSpreadsheet className="text-lg" />
                            Download Report
                        </button>
                    </div>

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

                        <button className="hidden lg:flex download-btn" onClick={handleDownloadReport}>
                            <LuFileSpreadsheet className="text-lg" />
                            Download Report
                        </button>
                    </div>
                </div>

                {/* Grid View */}
                {viewMode === "grid" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {allTasks.length > 0 ? (
                            allTasks.map((item) => (
                                <TaskCard
                                    key={item._id}
                                    title={item.title || 'Untitled Task'}
                                    description={item.description || 'No description available'}
                                    priority={item.priority || 'Medium'}
                                    status={item.status || 'Pending'}
                                    progress={item.progress || 0}
                                    createdAt={item.createdAt || new Date()}
                                    dueDate={item.dueDate}
                                    assignedTo={Array.isArray(item.assignedTo)
                                        ? item.assignedTo.map(a => a.profileImageUrl).filter(Boolean)
                                        : []}
                                    attachmentCount={Array.isArray(item.attachments) ? item.attachments.length : 0}
                                    completedTodoCount={Array.isArray(item.todoChecklist)
                                        ? item.todoChecklist.filter(todo => todo.done).length
                                        : 0}
                                    todoChecklist={Array.isArray(item.todoChecklist) ? item.todoChecklist : []}
                                    onClick={() => handleClick(item)}
                                />
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">No tasks found</p>
                        )}
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

export default ManageTasks;