import { createContext, useState, useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { UiContext } from "./utils/UiContext";
import { loadUserDetails } from "./loadUserDetails";
import { io } from "socket.io-client";
import { server_url } from "./configs/server_url";

export const AppContext = createContext(null);

export function AppProvider({ children }) {
    // User details:
    const [user_details, setUserDetails] = useState({});

    // For loading screen:
    const [is_loading, setLoading] = useState(false);
    const { setOverride } = useContext(UiContext);

    // To check login:
    const [is_logged_in, setIsLoggedIn] = useState(() => {
        const status = sessionStorage.getItem("is_logged_in");
        return status === "true";
    });

    const setLogin = () => {
        setIsLoggedIn(true);
        sessionStorage.setItem("is_logged_in", "true");
    };

    const setLogOut = () => {
        setIsLoggedIn(false);
        sessionStorage.setItem("is_logged_in", "false");
    };

    // For socket connection:
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        is_logged_in && loadUserDetails(setUserDetails, setLoading, setOverride, setLogOut);
    }, [is_logged_in]);

    const handleSocketErrors = (res) => {
        switch (res.code) {
            case "FORBIDDEN_ACCESS":
                setLogOut();

                break;
        }
    }

    useEffect(() => {
        if (!is_logged_in) return;

        if (socket === null)
            setSocket(
                io(server_url, {
                    auth: {
                        token: localStorage.getItem("token")
                    }
                })
            );

        if (socket !== null) {
            socket.on("socket_error", handleSocketErrors);

            return () => socket.off("socket_error", handleSocketErrors);
        }
    }, [socket, is_logged_in]);

    return (
        <AppContext.Provider
            value={{
                is_loading,
                setLoading,
                is_logged_in,
                setLogin,
                setLogOut,
                user_details,
                setUserDetails,
                socket,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function LoginProtector({ children }) {
    const { is_logged_in } = useContext(AppContext);

    if (!is_logged_in) {
        return <Navigate to="/signin" replace />;
    }

    return children;
}
