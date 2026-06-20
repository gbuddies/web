import { useContext, useEffect, useState } from "react";
import axios from "axios";
import createContact from "../direct-messages/CreateContact";
import styles from "./user_profile.module.css";
import { server_url } from '../../configs/server_url.js';
import { AppContext } from "../../Contexts";
import PageLoader from "../loading_screen/PageLoader";
import { FriendContext } from "../../utils/FriendContexts";
import { DMContext } from "../../utils/DMContext";
import { useNavigate } from "react-router-dom";

export default function UserProfile(props) {
    const [loader, setLoader] = useState(true);

    // Global Functions
    const {
        sendRequest,
        removeFriend
    } = useContext(FriendContext);

    const {
        setChatSelected,
        setLoading,
        setSelectedCID,
        setContactDetails,
        setAddContact
    } = useContext(DMContext);

    const user_id = props.user_id;
    const { user_details, setLogOut } = useContext(AppContext);
    const [user_data, setUserData] = useState({});

    const [request_sent, setRequestSent] = useState(false);

    const handleAddFriend = async () => {
        try {
            await sendRequest(
                user_data.id,
                user_data.username,
                user_data.pfp
            );

            setRequestSent(true);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        axios.get(
            server_url + `/users/get-user?user_id=${user_details?.id || localStorage.getItem("user_id")}&req_user_id=${user_id}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        )
            .then(res => {
                setUserData(res.data.user);
            }).catch(err => {
                console.log(err);

                if (["INVALID_JWT", "FORBIDDEN"].includes(err.response?.data?.code))
                    setLogOut();
            })
    }, []);

    useEffect(() => {
        if (!Object.keys(user_data).length)
            return;

        setLoader(false);
    }, [user_data]);

    const navigate = useNavigate();

    return (
        <div className={styles.wrapper}>
            <div className={styles.profileMainDiv}>
                {
                    loader
                        ?
                        <PageLoader />
                        :
                        <>
                            <div className={styles.userProfileInfo}
                            >
                                <div className={styles.pfp}>
                                    <img
                                        src={server_url + "/files/" + user_data?.pfp}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                                        }}
                                    />
                                </div>

                                <div className={styles.profileName}>
                                    <h2>{user_data?.username + (user_data.id === user_details?.id ? " (You)" : "") || "User"}</h2>

                                    {
                                        user_data.department
                                            ? <h5>{user_data?.department}</h5>
                                            : <p style={{
                                                fontStyle: "italic",
                                                color: "var(--text-secondary)",
                                                fontSize: ".7em"
                                            }}>Department info not shared</p>
                                    }
                                </div>
                            </div>

                            <hr />

                            <div className={styles.about}>
                                <h3>About</h3>

                                {
                                    user_data.about
                                        ?
                                        <h5>{user_data?.about}</h5>
                                        :
                                        <p style={{
                                            fontStyle: "italic",
                                            color: "var(--text-secondary)",
                                            fontSize: ".75em"
                                        }}>No bio added yet</p>
                                }
                            </div>

                            <hr />

                            {
                                user_data.id !== user_details?.id
                                &&
                                <div className={styles.bottomBtns}>
                                    {
                                        user_data.is_friend
                                            ?
                                            <>
                                                <button
                                                    onClick={async () => {
                                                        const c_det = await createContact(user_details?.id || sessionStorage.getItem("user_id"), user_data.friend_id, { setLogOut });
                                                        await setChatSelected(true);
                                                        setLoading(true);
                                                        await setSelectedCID(Number(c_det?.contact_id));
                                                        await setContactDetails({
                                                            username: c_det?.username,
                                                            pfp: c_det?.pfp
                                                        });
                                                        await setAddContact(false);

                                                        navigate("/direct-messages");
                                                    }}
                                                ><i className="fa-regular fa-message"></i> Message</button>

                                                <button
                                                    style={{
                                                        backgroundColor: "transparent",
                                                        border: "none",
                                                        outline: "none",
                                                        color: "var(--danger)",
                                                        fontWeight: "500",
                                                        letterSpacing: "1px"
                                                    }}
                                                    onClick={async () => {
                                                        try {
                                                            await removeFriend(user_data.friend_id);

                                                            setUserData(prev => ({
                                                                ...prev,
                                                                is_friend: false,
                                                                friend_id: null
                                                            }));
                                                        } catch (err) {
                                                            console.error(err);
                                                        }
                                                    }}
                                                ><i style={{ color: "var(--danger)" }} className="fa-solid fa-user-minus"></i> Remove Friend</button>
                                            </>
                                            :
                                            <>
                                                {
                                                    request_sent
                                                        ? (
                                                            <div
                                                                style={{
                                                                    padding: "9px 8px",
                                                                    border: "1px solid var(--border-light)",
                                                                    backgroundColor: "var(--bg)",
                                                                    borderRadius: "8px",
                                                                    margin: "0",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    flex: "1"
                                                                }}
                                                            >
                                                                <i
                                                                    style={{
                                                                        color: "var(--text-secondary)",
                                                                        fontSize: "0.88em"
                                                                    }}
                                                                    className="fa-regular fa-clock"
                                                                ></i>
                                                            </div>
                                                        )
                                                        : (
                                                            <button onClick={handleAddFriend}>
                                                                <i className="fa-solid fa-user-plus"></i> Add Friend
                                                            </button>
                                                        )
                                                }
                                            </>
                                    }
                                </div>
                            }

                            <button
                                style={{
                                    backgroundColor: "transparent",
                                    border: "none",
                                    outline: "none",
                                    color: "var(--danger)",
                                    fontWeight: "500",
                                    letterSpacing: "1px",
                                    marginTop: "12px"
                                }}
                                onClick={() => props.closeHook(false)}
                            >Close</button>
                        </>
                }
            </div>
        </div >
    );
}