import React from "react";

const AvatarGroup = ({ avatars, maxVisible = 3 }) => {
    // Safety check: ensure avatars is an array
    const safeAvatars = Array.isArray(avatars) ? avatars : [];

    // Normalize avatar URLs
    const normalizeUrl = (avatar) => {
        if (!avatar) {
            // No image provided → fallback to initials avatar
            return "https://ui-avatars.com/api/?name=User&background=random&color=fff";
        }
        if (typeof avatar === 'string' && avatar.startsWith("http")) return avatar;
        return `http://localhost:8000${avatar}`;
    };

    // If no avatars, return null
    if (safeAvatars.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center">
            {safeAvatars.slice(0, maxVisible).map((avatar, index) => (
                <img
                    key={index}
                    src={normalizeUrl(avatar)}
                    alt={`Avatar ${index}`}
                    className="w-9 h-9 rounded-full border-2 border-white -ml-3 first:ml-0 object-cover"
                />
            ))}

            {safeAvatars.length > maxVisible && (
                <div className="w-9 h-9 flex items-center justify-center bg-blue-50 text-sm font-medium rounded-full border-2 border-white -ml-3">
                    +{safeAvatars.length - maxVisible}
                </div>
            )}
        </div>
    );
};

export default AvatarGroup;