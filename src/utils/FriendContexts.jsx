import { createContext, useContext, useState } from "react";
import axios from "axios";
import { server_url } from '../configs/server_url';
import { AppContext } from '../Contexts';

export const FriendContext = createContext(null);

export function FriendProvider({ children }) {
    const { user_details, setLogOut } = useContext(AppContext);
    const [sent, setSent] = useState([]);
    const [received, setReceived] = useState([]);
    const [friends, setFriends] = useState([]);

    const sendRequest = async (receiver_id, receiver_name, receiver_pfp) => {
        if (!receiver_id) return;

        axios.post(`${server_url}/users/requests?action=send&user_id=${user_details?.id || localStorage.getItem("user_id")}`,
            {
                senderId: user_details?.id || localStorage.getItem("user_id"),
                receiverId: receiver_id
            },
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            } // res.data = { request_id -> id of the request row in db }
        ).then(res => {
            const request_id = res.data.response;

            setSent(prev => ([
                {
                    request_id,
                    user_id: user_details?.id || sessionStorage.getItem("user_id"),
                    receiver_id,
                    receiver_name,
                    receiver_pfp,
                    sent_at: ""
                },
                ...prev
            ]));
        }).catch(err => {
            console.log(err);
            if (["INVALID_JWT", "FORBIDDEN"].includes(err.response?.data?.code))
                setLogOut();
        });
    };

    const acceptRequest = async (requestId) => {
        try {
            await axios.post(
                `${server_url}/users/requests?action=accept&user_id=${user_details?.id || localStorage.getItem("user_id")}`,
                {
                    requestId: requestId,
                    userId: user_details?.id || Number(localStorage.getItem("user_id"))
                },
                {
                    headers: {
                        auth_token: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            ); // res.data.response = { friend_id -> the id of relationship row in db }

            // remove from received UI
            setReceived(prev => prev.filter(r => r.request_id !== requestId));

            // Server returns this (Idhi maracchu nvu expect chesina object kakunda):
            // sentRes.data.sent_reqs = array of {
            //  request_id -> the id of this request in DB,
            //  user_id -> the id of user who sent this request,
            //  receiver_id -> the one u sent this request to,
            //  receiver_name -> name of receiver,
            //  receiver_pfp -> pfp filename of receiver,
            //  sent_at -> the time at which this req was sent (UTC)
            // }
            // refresh sent requests (opposite request deleted in backend)
            const sentRes = await axios.get(
                `${server_url}/users/requests/sent?user_id=${user_details?.id || localStorage.getItem("user_id")}`,
                {
                    headers: {
                        auth_token: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            console.log(sentRes.data.sent_reqs);
            setSent(sentRes.data?.sent_reqs);

            // refresh friends list
            const friendsRes = await axios.get(
                `${server_url}/users/friends?user_id=${user_details?.id || localStorage.getItem("user_id")}`,
                {
                    headers: {
                        auth_token: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            ); // Server returns the following:
            // friendRes.data.friends = array of {
            //  friend_id -> id of the relationship in db
            //  id -> id of ur friedn
            //  username -> username of ur friend
            //  pfp -> pfp filename of ur frined
            // }

            setFriends(friendsRes.data.friends);

        } catch (err) {
            console.error("Accept request failed:", err);

            if (["INVALID_JWT", "FORBIDDEN"].includes(err.response?.data?.code))
                setLogOut();
        }
    };

    const rejectRequest = async (requestId) => {
        axios.post(
            `${server_url}/users/requests?action=reject&user_id=${user_details?.id || localStorage.getItem("user_id")}`,
            {
                requestId: requestId,
                userId: user_details?.id || localStorage.getItem("user_id")
            },
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ) // Returns { request_id }
            .then(res => {
                setReceived(prev => prev.filter(r => r.request_id !== requestId));
            })
            .catch(err => {
                if (["INVALID_JWT", "FORBIDDEN"].includes(err.response?.data?.code))
                    setLogOut();
            });

    };

    const removeFriend = async (friendId) => {
        // Here friendId is expected to be relationship id in db.

        if (!friendId) return;

        try {
            await axios.post(
                `${server_url}/users/friends/remove?user_id=${user_details?.id || localStorage.getItem("user_id")}`,
                {
                    userId: user_details?.id || localStorage.getItem("user_id"),
                    friendId
                },
                {
                    headers: {
                        auth_token: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setFriends(prev => prev.filter(f => f.friend_id !== friendId));
        } catch (err) {
            console.error(err);

            if (["INVALID_JWT", "FORBIDDEN"].includes(err.response?.data?.code))
                setLogOut();
        }
    };

    return (
        <FriendContext.Provider
            value={{
                sent,
                received,
                friends,
                setSent,
                setReceived,
                setFriends,
                sendRequest,
                acceptRequest,
                rejectRequest,
                removeFriend,
            }}
        >
            {children}
        </FriendContext.Provider>
    );
}