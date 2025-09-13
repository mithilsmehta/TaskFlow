import React, { useState, useContext } from "react";
import AuthLayout from "../../components/layouts/AuthLayout";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Inputs/Input";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/UserContext";
import toast from "react-hot-toast";

const SignUp = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [inviteToken, setInviteToken] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [error, setError] = useState(null);

    const { updateUser } = useContext(UserContext);
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();

        if (!name || !email || !password || !inviteToken) {
            setError("All fields are required (except profile image).");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("email", email);
            formData.append("password", password);
            formData.append("adminInviteToken", inviteToken);

            if (profileImage) {
                formData.append("image", profileImage);
            }

            const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const { token, user } = response.data;

            if (token && user) {
                localStorage.setItem("token", token);
                localStorage.setItem("role", user.role);

                updateUser({ token, user });

                // ✅ Show success toast
                toast.success("Account created successfully 🎉");

                // Redirect → only members sign up here
                navigate("/user/dashboard", { replace: true });
            }
        } catch (error) {
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError("Something went wrong. Please try again.");
            }
        }
    };

    return (
        <AuthLayout>
            <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
                <h3 className="text-xl font-semibold text-black">Create an Account</h3>
                <p className="text-xs text-slate-700 mt-[5px] mb-6">
                    Join your company’s workspace using the invite token.
                </p>

                <form onSubmit={handleSignUp}>
                    <Input
                        value={name}
                        onChange={({ target }) => setName(target.value)}
                        label="Full Name"
                        placeholder="John Doe"
                        type="text"
                    />

                    <Input
                        value={email}
                        onChange={({ target }) => setEmail(target.value)}
                        label="Email Address"
                        placeholder="john@example.com"
                        type="email"
                    />

                    <Input
                        value={password}
                        onChange={({ target }) => setPassword(target.value)}
                        label="Password"
                        placeholder="Min 6 Characters"
                        type="password"
                    />

                    <Input
                        value={inviteToken}
                        onChange={({ target }) => setInviteToken(target.value)}
                        label="Company Invite Token"
                        placeholder="Enter your company invite token"
                        type="text"
                    />

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Profile Picture (optional)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProfileImage(e.target.files[0])}
                            className="block w-full text-sm text-gray-700 border rounded p-2"
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}

                    <button type="submit" className="btn-primary">
                        SIGN UP
                    </button>

                    <p className="text-[13px] text-slate-800 mt-3">
                        Already have an account?{" "}
                        <Link className="font-medium text-primary underline" to="/login">
                            Login
                        </Link>
                    </p>
                </form>
            </div>
        </AuthLayout>
    );
};

export default SignUp;