import React from "react";

const Avatar = ({ src, alt, name }) => {
    // If no src → fallback to initials avatar
    const getAvatarUrl = () => {
        if (src) {
            if (src.startsWith("http")) return src;
            return `http://localhost:8000${src}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random&color=fff`;
    };

    return (
        <img
            src={getAvatarUrl()}
            alt={alt || name || "Avatar"}
            className="w-16 h-16 rounded-full object-cover border"
        />
    );
};

export default Avatar;