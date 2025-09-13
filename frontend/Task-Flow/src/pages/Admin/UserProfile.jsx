import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const UserProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    const fetchUser = async () => {
        try {
            const res = await axiosInstance.get(API_PATHS.USERS.GET_USER_BY_ID(id));
            setUser(res.data);
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [id]);

    if (!user) {
        return (
            <DashboardLayout>
                <p>Loading user profile...</p>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <button
                className="mb-4 text-blue-600 underline"
                onClick={() => navigate(-1)}
            >
                ← Back
            </button>

            <div className="card p-6">
                <div className="flex items-center gap-4">
                    <img
                        src={user.profileImageUrl || "http://localhost:8000/uploads/default-profile.png"}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover border"
                    />
                    <div>
                        <h2 className="text-xl font-semibold">{user.name}</h2>
                        <p className="text-gray-600">{user.email}</p>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                            {user.role}
                        </span>
                        <p className="text-sm mt-2 text-gray-500">Company: {user.companyName}</p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                    <StatCard label="Pending" value={user.pendingTasks || 0} />
                    <StatCard label="In Progress" value={user.inProgressTasks || 0} />
                    <StatCard label="Completed" value={user.completedTasks || 0} />
                </div>
            </div>
        </DashboardLayout>
    );
};

const StatCard = ({ label, value }) => (
    <div className="p-4 bg-gray-50 rounded text-center shadow">
        <p className="text-lg font-bold">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
    </div>
);

export default UserProfile;