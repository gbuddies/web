import styles from "./view_room.module.css";
import SideBar from "../../../../reusable_component/SideBar";
import RoomMember from "./RoomMember";
import PageLoader from "../../../loading_screen/PageLoader";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import axios from "axios";

import { server_url } from '../../../../configs/server_url';
import { AppContext } from "../../../../Contexts";
import NewRoom from "../../CreateRoom";
import UserProfile from "../../../user_profile/UserProfile";
import { UiContext } from "../../../../utils/UiContext";

export default function ViewRoom() {
    const [loader, setLoader] = useState(true);

    const { room_id } = useParams();
    const location = useLocation();
    const [is_member, setIsMember] = useState(location.state?.is_member);
    const from = location.state?.from || "/rooms";

    const [room_members, setRoomMembers] = useState([]);
    const { user_details, setLogOut } = useContext(AppContext);
    const { setRoomFilter } = useContext(UiContext);

    const [c_user_id, setCurrentUserId] = useState(0);

    const [refreshData, setRefreshState] = useState(0);

    // If is_member is undefined, get that from backend:
    useEffect(() => {
        if (is_member === true || is_member === false) {
            return;
        }

        axios.get(
            server_url + `/rooms/is_member?user_id=${user_details?.id || localStorage.getItem("user_id")}&room_id=${room_id}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).then(res => {
            setIsMember(res.data.is_member);
        }).catch(err => {
            console.log(err);

            if (["INVALID_JWT", "FORBIDDEN_ACCESS"].includes(err.response?.data?.code))
                setLogOut();
        });
    }, []);

    useEffect(() => {
        setCurrentUserId(user_details?.id || 0);
    }, [user_details?.id]);

    const navigate = useNavigate();

    const [room_data, setRoomData] = useState({});

    useEffect(() => {
        axios.get(
            server_url + `/rooms/get-room?user_id=${user_details?.id || localStorage.getItem("user_id")}&room_id=${room_id}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).then(res => {
            const data = res.data;
            setRoomData(data.room_info);
        }).catch(err => {
            console.log(err);

            if (["INVALID_JWT", "FORBIDDEN_ACCESS"].includes(err.response?.data?.code))
                setLogOut();
        });

        axios.get(
            server_url + `/rooms/members?user_id=${user_details?.id || localStorage.getItem("user_id")}&room_id=${room_id}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).then(res => {
            setRoomMembers(res.data.members);
        }).catch(err => {
            console.log(err);

            if (["INVALID_JWT", "FORBIDDEN_ACCESS"].includes(err.response?.data?.code))
                setLogOut();
        });
    }, [room_id, refreshData]);

    const handleJoin = async (e) => {

        switch (room_data.join_pref) {
            case "Anyone Can Join":
                axios.get(
                    server_url + `/rooms/join?room_id=${room_data.r_id}&user_id=${c_user_id}`,
                    {
                        headers: {
                            auth_token: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                ).then(res => {
                    setRefreshState(prev => prev + 1);
                    setRoomFilter("my");
                    navigate("/rooms");
                }).catch(err => {
                    console.log(err);

                    if (["INVALID_JWT", "FORBIDDEN_ACCESS"].includes(err.response?.data?.code))
                        setLogOut();
                });
        }
    };

    const handleLeave = async (e) => {
        await axios.get(
            server_url + `/rooms/leave?room_id=${room_data.r_id}&user_id=${c_user_id}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).catch(err => {
            console.log(err);
        });
    }

    const [show_settings, setShowSettings] = useState(false);
    const [show_profile, setShowProfile] = useState(false);

    useEffect(() => {
        if (!Object.keys(room_data).length)
            return;

        setLoader(false);
    }, [room_data]);

    return (
        <div className={styles.viewRoom}>
            <SideBar
                location="/room"
                active_page="privaterooms"
            />
            {
                loader
                    ?
                    <PageLoader />

                    :
                    <div className={styles.roomInfo}>
                        <div className={styles.header}>
                            <button
                                className={styles.backBtn}
                                onClick={() => navigate(from)}
                            >
                                <i className="fa-solid fa-chevron-left"></i>
                                <span> Back</span>
                            </button>
                        </div>

                        <div className={styles.roomDisplay}>
                            <div className={styles.icon}>
                                <img
                                    src={server_url + `/files/${room_data.icon_url}`}
                                    onError={(e) => {
                                        e.target.onError = null;
                                        e.target.src = "https://cdn-icons-png.flaticon.com/512/8184/8184182.png";
                                    }}
                                />
                            </div>

                            <h1>{room_data.r_name}</h1>

                            <div className={styles.wrappersWrapper}>
                                <div className={styles.displayWrapper}>
                                    <div className={styles.otherInfo}>
                                        <h5><i className="fa-solid fa-user-tie"></i> Admin:</h5>

                                        <h5>
                                            {room_data.admin_name}
                                            <span
                                                onClick={() => {
                                                    setShowProfile(true);
                                                }}
                                            >{"  "}<i className="fa-solid fa-link"></i></span>
                                        </h5>
                                    </div>

                                    <div className={styles.otherInfo2}>
                                        <h5>
                                            <i className="fa-solid fa-people-group"></i> Members {room_data.popl_size}/{room_data.r_size}
                                        </h5>

                                        <h5>
                                            <i className="fa-solid fa-shield-halved"></i> {room_data.r_type}
                                        </h5>

                                        <h5>
                                            {
                                                room_data.join_pref === "Anyone Can Join"
                                                    ? <i className="fa-solid fa-globe"></i>
                                                    :
                                                    room_data.join_pref === "Invite Only"
                                                        ?
                                                        <i className="fa-solid fa-lock"></i>
                                                        :
                                                        <i className="fa-solid fa-person-circle-check"></i>
                                            }
                                            {" " + room_data.join_pref}
                                        </h5>
                                    </div>
                                </div>

                                <div className={styles.roomButtons}>
                                    {
                                        c_user_id === room_data.id
                                        &&
                                        <button
                                            className={styles.editRoom}
                                            onClick={() => setShowSettings(true)}
                                        ><i className="fa-regular fa-pen-to-square"></i></button>
                                    }

                                    {
                                        (
                                            from.startsWith("/rooms")
                                            &&
                                            is_member
                                        )
                                        &&
                                        <button
                                            className={styles.openBtn}
                                            style={{ marginRight: "16px" }}
                                            onClick={() => navigate(`/room/home/${room_id}`)}
                                        ><i className="fa-solid fa-comment"></i></button>
                                    }

                                    {
                                        !is_member
                                            ?
                                            (
                                                room_data.join_pref !== "Invite Only" &&
                                                <button
                                                    className={styles.joinBtnn}
                                                    onClick={handleJoin}
                                                >
                                                    {
                                                        room_data.join_pref === "Approve Join Requests"
                                                            ? "Request Join"
                                                            : room_data.join_pref === "Anyone Can Join"
                                                                ? <i className="fa-solid fa-arrow-right-to-bracket"></i>
                                                                : <i class="fa-solid fa-lock"></i>
                                                    }
                                                </button>
                                            )
                                            :
                                            (
                                                c_user_id !== room_data.id
                                                &&
                                                <button
                                                    className={styles.leaveBtn}
                                                    onClick={async () => {
                                                        await handleLeave();
                                                        navigate("/rooms");
                                                    }}
                                                ><i className="fa-solid fa-arrow-right-from-bracket"></i></button>
                                            )
                                    }
                                </div>
                            </div>
                        </div>

                        <div className={styles.roomDetails}>
                            <div className={styles.roomDesc}>
                                <h3><i className="fa-solid fa-circle-info"></i> About this room</h3>

                                <h5>{room_data.r_desc || "No Description Available"}</h5>
                            </div>
                        </div>

                        <div className={styles.members}>
                            <h3>Room Members</h3>

                            <RoomMember
                                key={room_data.id}
                                admin={true}
                                name={c_user_id === room_data.id ? "You" : room_data.admin_name}
                                pfp={room_data.admin_pfp}
                            />

                            {
                                room_members?.length > 0 && room_members.map(member => (
                                    member.id !== room_data.id
                                    &&
                                    <RoomMember
                                        key={member.id}
                                        admin={false}
                                        name={c_user_id === member.id ? "You" : member.username}
                                        pfp={member.pfp}
                                        amiadmin={user_details.id === room_data.id}
                                    />
                                ))
                            }
                        </div>

                        <div className={styles.buffer}></div>
                    </div>
            }

            {
                show_settings
                &&
                <div className={styles.roomSettings}>
                    <NewRoom
                        header="Change Room Settings"
                        btn_text="Update"
                        icon_url={room_data.icon_url}
                        image_upload_text="Update Logo"
                        alter="Update"
                        altering="Updating..."
                        room_data={room_data}
                        api="update"
                        closeHook={setShowSettings}
                        setRefreshState={setRefreshState}
                    />
                </div>
            }

            {
                show_profile
                &&
                <div className={styles.adminProfile}>
                    <UserProfile
                        user_id={room_data.id}
                        closeHook={setShowProfile}
                    />
                </div>
            }
        </div>
    );
}