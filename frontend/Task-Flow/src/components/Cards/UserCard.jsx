import React from "react";

const UserCard = ({ userInfo }) => {
    // Normalize profile image URL
    const getProfileImage = (url) => {
        if (!url) return "http://localhost:8000/uploads/default-profile.png";
        if (url.startsWith("http")) return url;
        return `http://localhost:8000${url}`;
    };

    return (
        <div className="user-card p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition cursor-pointer">
            <div className="flex items-center gap-3">
                <img
                    src={getProfileImage(userInfo?.profileImageUrl)}
                    alt={`${userInfo?.name || "User"} Avatar`}
                    className="w-12 h-12 rounded-full border object-cover"
                />

                <div>
                    <p className="text-sm font-medium">{userInfo?.name}</p>
                    <p className="text-xs text-gray-500">{userInfo?.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Company: <span className="font-medium">{userInfo?.companyName}</span>
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] rounded bg-blue-100 text-blue-600">
                        {userInfo?.role}
                    </span>
                </div>
            </div>

            <div className="flex items-end gap-3 mt-4">
                <StatCard
                    label="Pending"
                    count={userInfo?.pendingTasks || 0}
                    status="Pending"
                />
                <StatCard
                    label="In Progress"
                    count={userInfo?.inProgressTasks || 0}
                    status="In Progress"
                />
                <StatCard
                    label="Completed"
                    count={userInfo?.completedTasks || 0}
                    status="Completed"
                />
            </div>
        </div>
    );
};

export default UserCard;

const StatCard = ({ label, count, status }) => {
    const getStatusTagColor = () => {
        switch (status) {
            case "In Progress":
                return "text-cyan-500 bg-gray-50";
            case "Completed":
                return "text-indigo-500 bg-gray-50";
            default:
                return "text-violet-500 bg-gray-50";
        }
    };

    return (
        <div
            className={`flex-1 text-[10px] font-medium ${getStatusTagColor()} px-3 py-1 rounded text-center`}
        >
            <span className="text-[12px] font-semibold">{count}</span>
            <br />
            {label}
        </div>
    );
};