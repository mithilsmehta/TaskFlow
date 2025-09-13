import React from "react";

const AvatarGroup = ({ avatars, maxVisible = 3 }) => {
    // Normalize avatar URLs
    const normalizeUrl = (avatar) => {
        if (!avatar) {
            // No image provided → fallback to initials avatar
            return "https://ui-avatars.com/api/?name=User&background=random&color=fff";
        }
        if (avatar.startsWith("http")) return avatar;
        return `http://localhost:8000${avatar}`;
    };

    return (
        <div className="flex items-center">
            {avatars.slice(0, maxVisible).map((avatar, index) => (
                <img
                    key={index}
                    src={normalizeUrl(avatar)}
                    alt={`Avatar ${index}`}
                    className="w-9 h-9 rounded-full border-2 border-white -ml-3 first:ml-0 object-cover"
                />
            ))}

            {avatars.length > maxVisible && (
                <div className="w-9 h-9 flex items-center justify-center bg-blue-50 text-sm font-medium rounded-full border-2 border-white -ml-3">
                    +{avatars.length - maxVisible}
                </div>
            )}
        </div>
    );
};

export default AvatarGroup;