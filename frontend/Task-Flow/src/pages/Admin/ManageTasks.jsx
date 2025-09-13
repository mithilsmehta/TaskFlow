import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuFileSpreadsheet } from "react-icons/lu";
import TaskStatusTabs from "../../components/TaskStatusTabs";
import TaskCard from "../../components/Cards/TaskCard";
import toast from "react-hot-toast";

const ManageTasks = () => {
    const [allTasks, setAllTasks] = useState([]);
    const [tabs, setTabs] = useState([]);
    const [filterStatus, setFilterStatus] = useState("All");

    const navigate = useNavigate();

    const getAllTasks = async () => {
        try {
            const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
                params: {
                    status: filterStatus === "All" ? "" : filterStatus,
                },
            });

            console.log("API Response (tasks):", response.data);

            // ✅ Backend returns an array, not { tasks: [...] }
            const tasks = Array.isArray(response.data.tasks) ? response.data.tasks : [];

            setAllTasks(tasks);

            // ✅ Build summary on frontend since backend doesn’t send it
            const statusSummary = {
                all: tasks.length,
                pendingTasks: tasks.filter(t => t.status === "Pending").length,
                inProgressTasks: tasks.filter(t => t.status === "In Progress").length,
                completedTasks: tasks.filter(t => t.status === "Completed").length,
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

    const handleClick = (taskData) => {
        navigate(`/admin/create-task`, { state: { taskId: taskData._id } });
    };

    // download task report
    const handleDownloadReport = async () => {
        try {
            const response = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_TASKS, {
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "task_details.xlsx");
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading details:", error);
            toast.error("Failed to download details. Please try again.");
        }
    };

    useEffect(() => {
        getAllTasks();
    }, [filterStatus]);

    return (
        <DashboardLayout activeMenu="Manage Tasks">
            <div className="my-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
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

                    {tabs?.[0]?.count > 0 && (
                        <div className="flex items-center gap-3">
                            <TaskStatusTabs
                                tabs={tabs}
                                activeTab={filterStatus}
                                setActiveTab={setFilterStatus}
                            />

                            <button className="hidden lg:flex download-btn" onClick={handleDownloadReport}>
                                <LuFileSpreadsheet className="text-lg" />
                                Download Report
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {allTasks.length > 0 ? (
                        allTasks.map((item) => (
                            <TaskCard
                                key={item._id}
                                title={item.title}
                                description={item.description}
                                priority={item.priority}
                                status={item.status}
                                progress={item.progress}
                                createdAt={item.createdAt}
                                dueDate={item.dueDate}
                                assignedTo={item.assignedTo?.map((a) => a.profileImageUrl)}
                                attachmentCount={item.attachments?.length || 0}
                                completedTodoCount={item.completedTodoCount || 0}
                                todoChecklist={item.todoChecklist || []}
                                onClick={() => handleClick(item)}
                            />
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">No tasks found</p>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ManageTasks;