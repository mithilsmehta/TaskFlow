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

const UserDashboard = () => {
    useUserAuth();
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    const [dashboardData, setDashboardData] = useState(null);

    const fetchUserDashboard = async () => {
        try {
            const response = await axiosInstance.get(API_PATHS.TASKS.GET_USER_DASHBOARD_DATA);
            if (response.data) {
                setDashboardData(response.data);
            }
        } catch (error) {
            console.error("Error fetching user dashboard data:", error);
            toast.error("Failed to load dashboard");
        }
    };

    const onSeeMore = () => {
        navigate("/user/tasks");
    };

    useEffect(() => {
        fetchUserDashboard();
    }, []);

    return (
        <DashboardLayout activeMenu="Dashboard">
            <div className="card my-5">
                <div className="col-span-3">
                    <h2 className="text-xl md:text-2xl">Welcome, {user?.name}</h2>
                    <p className="text-xs md:text-[13px] text-gray-400 mt-1.5">
                        {moment().format("dddd Do MMM YYYY")}
                    </p>
                </div>

                {/* Info cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-5">
                    <InfoCard
                        label="Total Tasks"
                        value={addThousandsSeparator(dashboardData?.totalTasks || 0)}
                        color="bg-primary"
                    />
                    <InfoCard
                        label="Pending Tasks"
                        value={addThousandsSeparator(dashboardData?.taskDistribution?.Pending || 0)}
                        color="bg-violet-500"
                    />
                    <InfoCard
                        label="In Progress Tasks"
                        value={addThousandsSeparator(dashboardData?.taskDistribution?.InProgress || 0)}
                        color="bg-cyan-500"
                    />
                    <InfoCard
                        label="Completed Tasks"
                        value={addThousandsSeparator(dashboardData?.taskDistribution?.Completed || 0)}
                        color="bg-lime-500"
                    />
                </div>
            </div>

            {/* Charts + Recent Tasks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <h5 className="font-medium">Task Distribution</h5>
                    </div>
                    <CustomPieChart
                        data={[
                            { status: "Pending", count: dashboardData?.taskDistribution?.Pending || 0 },
                            { status: "In Progress", count: dashboardData?.taskDistribution?.InProgress || 0 },
                            { status: "Completed", count: dashboardData?.taskDistribution?.Completed || 0 },
                        ]}
                        colors={COLORS}
                    />
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <h5 className="font-medium">Task Priority Levels</h5>
                    </div>
                    <CustomBarChart data={[
                        { priority: "Low", count: dashboardData?.taskPriorityLevels?.Low || 0 },
                        { priority: "Medium", count: dashboardData?.taskPriorityLevels?.Medium || 0 },
                        { priority: "High", count: dashboardData?.taskPriorityLevels?.High || 0 },
                    ]} />
                </div>

                <div className="md:col-span-2 card">
                    <div className="flex items-center justify-between">
                        <h5 className="text-lg">My Recent Tasks</h5>
                        <button className="card-btn" onClick={onSeeMore}>
                            See All <LuArrowRight className="text-base" />
                        </button>
                    </div>
                    <TaskListTable tableData={dashboardData?.recentTasks || []} />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UserDashboard;