import axios from "axios";
import { server_url } from "./creds/server_url";

export const loadUserDetails = async (setUserDetails, setLoading, setOverride, setLogOut) => {
    if (!sessionStorage.getItem("user_id")) return;

    setLoading(true);
    setOverride("loading");

    try {
        const user_id = sessionStorage.getItem("user_id");
        const token = localStorage.getItem("token");

        if (!["/signin", "signup"].includes(window.location.pathname) && !token){
            console.log("User is not in signin or signup page and they don't have token.");
            setLogOut();
            return;
        }

        const res = await axios.get(
            `${server_url}/users/get-user?user_id=${user_id}&req_user_id=${user_id}`,
            {
                headers: {
                    auth_token: `Bearer ${token}`
                }
            }
        );

        if (res.data.code === "INVALID_JWT") setLogOut();

        setUserDetails(res.data.user);
    } catch (err) {
        console.log("User details not loaded:", err);
        setLogOut();
        setUserDetails({
            id: 0,
            username: "",
            email: "",
            is_verified: false,
            pfp: "#",
            department: "",
        });
    } finally {
        setOverride(null);
        setLoading(false);
    }
};
