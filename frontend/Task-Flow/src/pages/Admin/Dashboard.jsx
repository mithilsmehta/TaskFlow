import React, { useEffect, useState, useContext } from "react";
import { useUserAuth } from "../../hooks/useUserAuth";
import { UserContext } from "../../context/userContext";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import moment from "moment";
import { addThousandsSeparator } from "../../utils/helper";
import InfoCard from "../../components/Cards/InfoCard";
import { LuArrowRight } from "react-icons/lu";
import TaskListTable from "../../components/TaskListTable";
import CustomPieChart from "../../components/Charts/CustomPieChart";
import CustomBarChart from "../../components/Charts/CustomBarChart";
import toast from "react-hot-toast";

const COLORS = ["#8D51FF", "#00B8DB", "#7BCE00"];

const Dashboard = () => {
    useUserAuth();
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [pieChartData, setPieChartData] = useState([]);
    const [barChartData, setBarChartData] = useState([]);

    // Build charts dynamically
    const prepareChartData = (tasksList) => {
        if (!Array.isArray(tasksList)) return;

        const statusSummary = {
            all: tasksList.length,
            pending: tasksList.filter(t => t.status === "Pending").length,
            inProgress: tasksList.filter(t => t.status === "In Progress").length,
            completed: tasksList.filter(t => t.status === "Completed").length,
        };

        const prioritySummary = {
            low: tasksList.filter(t => t.priority === "Low").length,
            medium: tasksList.filter(t => t.priority === "Medium").length,
            high: tasksList.filter(t => t.priority === "High").length,
        };

        setPieChartData([
            { status: "Pending", count: statusSummary.pending },
            { status: "In Progress", count: statusSummary.inProgress },
            { status: "Completed", count: statusSummary.completed },
        ]);

        setBarChartData([
            { priority: "Low", count: prioritySummary.low },
            { priority: "Medium", count: prioritySummary.medium },
            { priority: "High", count: prioritySummary.high },
        ]);
    };

    const getDashboardData = async () => {
        try {
            const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);
            const tasksList = Array.isArray(response.data.tasks) ? response.data.tasks : [];
            setTasks(tasksList);
            prepareChartData(tasksList);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Failed to load dashboard data");
        }
    };

    const onSeeMore = () => {
        navigate("/admin/tasks");
    };

    useEffect(() => {
        getDashboardData();
    }, []);

    return (
        <DashboardLayout activeMenu="Dashboard">
            <div className="card my-5">
                <div className="col-span-3">
                    <h2 className="text-xl md:text-2xl">Welcome! {user?.name}</h2>
                    <p className="text-xs md:text-[13px] text-gray-400 mt-1.5">
                        {moment().format("dddd Do MMM YYYY")}
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-5">
                    <InfoCard
                        label="Total Tasks"
                        value={addThousandsSeparator(tasks.length)}
                        color="bg-primary"
                    />
                    <InfoCard
                        label="Pending Tasks"
                        value={addThousandsSeparator(tasks.filter(t => t.status === "Pending").length)}
                        color="bg-violet-500"
                    />
                    <InfoCard
                        label="In Progress Tasks"
                        value={addThousandsSeparator(tasks.filter(t => t.status === "In Progress").length)}
                        color="bg-cyan-500"
                    />
                    <InfoCard
                        label="Completed Tasks"
                        value={addThousandsSeparator(tasks.filter(t => t.status === "Completed").length)}
                        color="bg-lime-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <h5 className="font-medium">Task Distribution</h5>
                    </div>
                    <CustomPieChart data={pieChartData} colors={COLORS} />
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <h5 className="font-medium">Task Priority Levels</h5>
                    </div>
                    <CustomBarChart data={barChartData} />
                </div>

                <div className="md:col-span-2 card">
                    <div className="flex items-center justify-between">
                        <h5 className="text-lg">Recent Tasks</h5>
                        <button className="card-btn" onClick={onSeeMore}>
                            See All <LuArrowRight className="text-base" />
                        </button>
                    </div>
                    <TaskListTable tableData={tasks.slice(0, 5)} />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;