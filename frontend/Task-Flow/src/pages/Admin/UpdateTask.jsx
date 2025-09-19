import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { PRIORITY_DATA } from "../../utils/data";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import moment from "moment";
import { LuTrash2, LuArrowLeft } from "react-icons/lu";
import SelectDropdown from "../../components/Inputs/SelectDropdown";
import SelectUsers from "../../components/Inputs/SelectUsers";
import TodoListInput from "../../components/Inputs/TodoListInput";
import AddAttachmentsInput from "../../components/Inputs/AddAttachmentsInput";
import DeleteAlert from "../../components/DeleteAlert";
import Modal from "../../components/Modal";

const UpdateTask = () => {
    const { taskId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const from = location.state?.from || "/admin/tasks";

    const [taskData, setTaskData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [openDeleteAlert, setOpenDeleteAlert] = useState(false);

    // Fetch task data
    useEffect(() => {
        const fetchTask = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(taskId));
                if (!response.data) {
                    throw new Error("No task data received");
                }

                const task = response.data;
                console.log('Task data received:', task);
                
                // Helper function to safely parse dates
                const parseDate = (dateString) => {
                    if (!dateString) return null;
                    const date = new Date(dateString);
                    return isNaN(date.getTime()) ? null : date;
                };
                
                // Ensure assignedTo is an array of user objects with _id
                const assignedTo = Array.isArray(task.assignedTo) 
                    ? task.assignedTo.map(user => ({
                        _id: user._id || user,
                        name: user.name || '',
                        email: user.email || '',
                        profileImageUrl: user.profileImageUrl || ''
                    }))
                    : [];

                // Ensure all required fields have default values
                const formattedTask = {
                    _id: task._id,
                    title: task.title || "",
                    description: task.description || "",
                    priority: task.priority || "Low",
                    status: task.status || "Pending",
                    startDate: parseDate(task.startDate),
                    dueDate: parseDate(task.dueDate),
                    assignedTo: assignedTo,
                    todoChecklist: Array.isArray(task.todoChecklist) 
                        ? task.todoChecklist.map(item => ({
                            _id: item._id || Math.random().toString(36).substr(2, 9),
                            text: item.text || "",
                            done: !!item.done
                          }))
                        : [],
                    attachments: Array.isArray(task.attachments) ? task.attachments : [],
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                    progress: typeof task.progress === 'number' ? task.progress : 0,
                    completedTodoCount: task.completedTodoCount || 0,
                    attachmentCount: task.attachmentCount || 0
                };
                
                console.log('Formatted task data:', formattedTask);
                setTaskData(formattedTask);
            } catch (error) {
                console.error("Error fetching task:", error);
                toast.error("Failed to load task");
                navigate(from);
            } finally {
                setLoading(false);
            }
        };

        if (taskId) {
            fetchTask();
        }
    }, [taskId, navigate, from]);

    const handleValueChange = (key, value) => {
        if (!taskData) return;
        setTaskData(prevData => ({
            ...prevData,
            [key]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!taskData) return;
        
        setSaving(true);
        setError("");

        try {
            // Format the payload for the API
            const formatDate = (date) => {
                return date ? moment(date).toISOString() : null;
            };

            const payload = {
                title: taskData.title,
                description: taskData.description,
                priority: taskData.priority,
                status: taskData.status,
                startDate: formatDate(taskData.startDate),
                dueDate: formatDate(taskData.dueDate),
                assignedTo: taskData.assignedTo.map(user => user._id || user),
                todoChecklist: taskData.todoChecklist.map(item => ({
                    _id: item._id,
                    text: item.text,
                    done: item.done
                })),
                attachments: taskData.attachments || []
            };
            
            console.log('Submitting task update:', payload);

            const response = await axiosInstance.put(
                API_PATHS.TASKS.UPDATE_TASK(taskId),
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                toast.success("Task updated successfully!");
                navigate(from);
            } else {
                throw new Error("No data received from server");
            }
        } catch (error) {
            console.error("Error updating task:", error);
            const errorMessage = error.response?.data?.message || 
                              error.message || 
                              "Failed to update task. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setOpenDeleteAlert(false);
            const response = await axiosInstance.delete(API_PATHS.TASKS.DELETE_TASK(taskId));
            
            if (response.status === 200 || response.status === 204) {
                toast.success("Task deleted successfully!");
                navigate(from);
            } else {
                throw new Error("Failed to delete task");
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            const errorMessage = error.response?.data?.message || 
                              error.message || 
                              "Failed to delete task. Please try again.";
            toast.error(errorMessage);
        }
    };

    if (loading || !taskData) {
        return (
            <DashboardLayout activeMenu="Update Task">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout activeMenu="Update Task">
            <div className="my-5">
                <div className="flex items-center justify-between mb-6">
                    <button
                        type="button"
                        onClick={() => navigate(from)}
                        className="flex items-center text-gray-600 hover:text-primary transition-colors"
                    >
                        <LuArrowLeft className="mr-2" /> Back to Tasks
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpenDeleteAlert(true)}
                        className="flex items-center text-red-600 hover:text-red-800 transition-colors"
                    >
                        <LuTrash2 className="mr-1" /> Delete Task
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="form-card">
                        <h2 className="text-lg font-medium mb-6">Update Task</h2>
                        
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Task Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={taskData.title}
                                    onChange={(e) => handleValueChange("title", e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                <SelectDropdown
                                    options={PRIORITY_DATA}
                                    value={taskData.priority}
                                    onChange={(value) => handleValueChange("priority", value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={taskData.dueDate ? moment(taskData.dueDate).format('YYYY-MM-DD') : ''}
                                    onChange={(e) => 
                                        handleValueChange("dueDate", e.target.value ? new Date(e.target.value) : null)
                                    }
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assign To
                                </label>
                                <SelectUsers
                                    selectedUsers={(taskData.assignedTo || []).map(u => (typeof u === 'object' ? u._id : u))}
                                    setSelectedUsers={(ids) => handleValueChange("assignedTo", ids)}
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={taskData.description}
                                onChange={(e) => handleValueChange("description", e.target.value)}
                                rows={4}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                            />
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Checklist
                            </label>
                            <TodoListInput
                                todoList={(taskData.todoChecklist || []).map(item => typeof item === 'string' ? item : (item?.text || ''))}
                                setTodoList={(list) => {
                                    // list is array of strings from TodoListInput
                                    const prev = Array.isArray(taskData.todoChecklist) ? taskData.todoChecklist : [];
                                    const next = list.map(text => {
                                        const existing = prev.find(t => (typeof t === 'object' ? t.text : t) === text);
                                        if (existing && typeof existing === 'object') return existing;
                                        return { _id: Math.random().toString(36).substr(2, 9), text, done: false };
                                    });
                                    handleValueChange('todoChecklist', next);
                                }}
                            />
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Attachments
                            </label>
                            <AddAttachmentsInput
                                attachments={taskData.attachments}
                                setAttachments={(attachments) => handleValueChange("attachments", attachments)}
                            />
                        </div>

                        <div className="mt-8 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => navigate(from)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Update Task'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <Modal isOpen={openDeleteAlert} onClose={() => setOpenDeleteAlert(false)}>
                <DeleteAlert
                    title="Delete Task"
                    message="Are you sure you want to delete this task? This action cannot be undone."
                    onConfirm={handleDelete}
                    onCancel={() => setOpenDeleteAlert(false)}
                />
            </Modal>
        </DashboardLayout>
    );
};

export default UpdateTask;
