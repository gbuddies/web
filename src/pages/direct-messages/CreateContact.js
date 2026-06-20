import axios from "axios";
import { server_url } from '../../configs/server_url';

export default async function createContact(user_id, friend_id, props) {
    // Here friend_id is the id of relation, not of a user.
    
    try {
        const res = await axios.post(
            `${server_url}/messages/create/contact?user_id=${user_id || sessionStorage.getItem("user_id")}&friend_id=${friend_id}`,
            {},
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        return res.data.contact_details || null;
    } 
    catch (err) {
        console.error("Create contact failed:", err);

        const code = err?.response?.data?.code;

        if (["INVALID_JWT", "FORBIDDEN_ACCESS"].includes(code)) {
            props?.setLogOut?.();
        }

        if (err.code === "ERR_NETWORK") {
            console.error("Network error: server unreachable.");
        }

        return null;
    }
}