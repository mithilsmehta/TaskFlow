import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { LuFileSpreadsheet } from "react-icons/lu";
import UserCard from "../../components/Cards/UserCard";
import { useNavigate } from "react-router-dom";

const ManageUsers = () => {
    const [allUsers, setAllUsers] = useState([]);
    const navigate = useNavigate();

    const getAllUsers = async () => {
        try {
            const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
            if (response.data?.length > 0) {
                setAllUsers(response.data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleDownloadReport = async () => {
        try {
            const response = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_USERS, {
                responseType: "blob",
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            });

            // Check if we got a valid response
            if (!response.data) {
                throw new Error('No data received from server');
            }

            // Get filename from response headers or use default
            const contentDisposition = response.headers['content-disposition'];
            const filename = contentDisposition
                ? contentDisposition.split('filename=')[1].replace(/"/g, '')
                : `users_report_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Create blob and download
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
        } catch (error) {
            console.error("Error downloading report:", error);
            alert("Failed to download report. Please try again.");
        }
    };

    useEffect(() => {
        getAllUsers();
    }, []);

    return (
        <DashboardLayout activeMenu="Team Members">
            <div className="mt-5 mb-10">
                <div className="flex md:flex-row md:items-center justify-between">
                    <h2 className="text-xl md:text-xl font-medium">Team Members</h2>

                    <button className="flex md:flex download-btn" onClick={handleDownloadReport}>
                        <LuFileSpreadsheet className="text-lg" />
                        Download Report
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {allUsers?.map((user) => (
                        <div key={user._id} onClick={() => navigate(`/admin/users/${user._id}`)}>
                            <UserCard userInfo={user} />
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ManageUsers;