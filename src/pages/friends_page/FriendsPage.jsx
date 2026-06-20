import { useEffect, useState, useContext } from 'react';
import axios from "axios";
import SideBar from '../../reusable_component/SideBar';
import styles from './friendspage.module.css';
import { server_url } from '../../configs/server_url';
import { AppContext } from '../../Contexts';
import Friend from '../../reusable_component/friend_div/Friend';
import PageLoader from '../loading_screen/PageLoader';
import DivLoader from '../loading_screen/DivLoader';
import UserProfile from '../user_profile/UserProfile';
import { FriendContext } from '../../utils/FriendContexts';

export default function FriendsPage() {

    // Global Funcs
    const {
        sent,
        received,
        friends,
        setSent,
        setReceived,
        setFriends,
        sendRequest,
        acceptRequest,
        rejectRequest,
        removeFriend
    } = useContext(FriendContext);

    const { user_details, setLogOut } = useContext(AppContext);

    // List loader
    const [div_loader, setDivLoader] = useState(true);
    const [requests_loader, setReqLoader] = useState(true);

    const [friend, setFriend] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [has_searched, setHasSearched] = useState(false);
    const [showRequests, setShowRequests] = useState(false);
    const [activeTab, setActiveTab] = useState("received");
    const [show_profile, setShowProfile] = useState(false);

    const searchFriends = async (query) => {
        try {
            setLoading(true);
            setHasSearched(true);

            const res = await axios.get(
                `${server_url}/users/search?user_id=${user_details?.id || localStorage.getItem("user_id")}&query=${query}&last_seen_id=${Number.MAX_SAFE_INTEGER}`,
                {
                    headers: {
                        auth_token: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            ); // server sends the following data:
            // res.data.users = array of {
            //  id -> user id,
            //  username -> their name,
            //  pfp -> their pfp (filename only not link). telusu kda, server_url tho...
            //  is_friend -> are they ur frnd (bool)
            // }

            setResults(res.data?.users || []);
        } catch (err) {
            console.error(err);

            if (["INVALID_JWT", "FORBIDDEN"].includes(err.response?.data?.code))
                setLogOut();
        }
        finally {
            setLoading(false);
        }
    };

    const isPending = (userId) =>
        sent.some(s => s.receiver_id == userId) ||
        received.some(r => r.sender_id == userId);

    useEffect(() => {
        if (!user_details?.id) return;

        setDivLoader(true);

        axios.get(
            `${server_url}/users/friends?user_id=${user_details?.id || localStorage.getItem("user_id")}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ) // Server returns the following:
            // friendRes.data.friends = array of {
            //  friend_id -> id of the relationship in db
            //  id -> id of ur friedn
            //  username -> username of ur friend
            //  pfp -> pfp filename of ur frined
            // }
            .then(res => {
                setFriends(res.data.friends);
                setDivLoader(false);
            })
            .catch(err => {
                console.log(err);

                if (["INVALID_USER", "FORBIDDEN_ACCESS"].includes(err.response?.data?.code))
                    setLogOut();

                setDivLoader(false);
            });
    }, [user_details]);

    useEffect(() => {
        if (!friend.trim()) {
            setResults([]);
            setHasSearched(false);
            setLoading(false);

            return;
        }

        const delay = setTimeout(() => {
            searchFriends(friend.trim());
        }, 400);

        return () => clearTimeout(delay);
    }, [friend]);

    useEffect(() => {
        if (!user_details?.id) return;

        setReqLoader(true);

        axios.get(
            `${server_url}/users/requests/received?user_id=${user_details?.id || localStorage.getItem("user_id")}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        )   // Server returns this:
            // sentRes.data.sent_reqs = array of {
            //  request_id -> the id of this request in DB,
            //  user_id -> the id of user who received this request (you),
            //  sender_id -> the one who sent u this request,
            //  sender_name -> name of sender,
            //  sender_pfp -> pfp filename of sender,
            //  sent_at -> the time at which this req was sent (UTC)
            // }
            .then(res => setReceived(res.data?.rec_reqs))
            .catch(console.error);

        // Server returns this (Idhi maracchu nvu expect chesina object kakunda):
        // sentRes.data.sent_reqs = array of {
        //  request_id -> the id of this request in DB,
        //  user_id -> the id of user who sent this request (you),
        //  receiver_id -> the one u sent this request to,
        //  receiver_name -> name of receiver,
        //  receiver_pfp -> pfp filename of receiver,
        //  sent_at -> the time at which this req was sent (UTC)
        // }
        // refresh sent requests (opposite request deleted in backend)
        axios.get(
            `${server_url}/users/requests/sent?user_id=${user_details?.id || localStorage.getItem("user_id")}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        )
            .then(res => {
                setSent(res.data?.sent_reqs);
                setReqLoader(false);
            })
            .catch(console.error);

    }, [showRequests, user_details]);

    return (
        <div className={styles.friendsMain}>
            <SideBar className={styles.sidebar}
                logo="#"
                active_page={'friends'}
            />

            <div className={styles.body}>
                <div className={styles.header}>
                    <div>
                        <div className={styles.pageNameContainer}>
                            <h2 className={styles.global}>Friends</h2>
                        </div>

                        <button
                            className={styles.requestsBtn}
                            onClick={() => setShowRequests(true)}
                        >
                            <i className="fa-solid fa-bell"></i>
                        </button>
                    </div>

                    <div className={styles.searchBar}>
                        <div><i className="fa-solid fa-magnifying-glass"></i></div>

                        <input
                            value={friend}
                            type="text"
                            placeholder="Search users..."
                            onChange={e => {
                                setFriend(e.target.value);
                            }}
                        />
                    </div>
                </div>

                <hr className={styles.divider} />

                {
                    (div_loader || loading)
                        ? <PageLoader />
                        : <div className={styles.friendsList}>
                            {
                                has_searched
                                    ?
                                    <>
                                        <h3
                                            style={{
                                                letterSpacing: "0.8px",
                                                margin: "8px"
                                            }}
                                        >{results.length > 0 ? "Search Results" : "No Results Found"}</h3>

                                        {
                                            results.map(r => (
                                                <Friend
                                                    key={r.id}
                                                    ruse={"searched_friend"}
                                                    user_id={r.id}
                                                    username={r.username}
                                                    url={r.pfp}
                                                    is_friend={r.is_friend}
                                                    is_pending={isPending(r.id)}
                                                    setShowProfile={setShowProfile}
                                                    removeFriend={r.is_friend ? removeFriend : null}
                                                    sendRequest={(!r.is_friend && !isPending(r.id)) ? sendRequest : null}
                                                />
                                            ))
                                        }
                                    </>
                                    :
                                    friends.length > 0
                                        ?
                                        <>
                                            <h3
                                                style={{
                                                    letterSpacing: "0.8px",
                                                    margin: "8px"
                                                }}
                                            >{"Your Friends"}</h3>

                                            {
                                                friends.map((f) => (
                                                    <Friend
                                                        key={f.friend_id}
                                                        ruse={"friends"}
                                                        user_id={f.id}
                                                        friend_id={f.friend_id}
                                                        url={f.pfp}
                                                        username={f.username}
                                                        setShowProfile={setShowProfile}
                                                        removeFriend={removeFriend}
                                                        sendRequest={sendRequest}
                                                    />
                                                ))
                                            }
                                        </>
                                        : <h5
                                            style={{
                                                marginTop: "8px"
                                            }}
                                        >You have no friends yet!</h5>
                            }
                        </div>
                }
            </div>

            {
                showRequests
                &&
                (
                    <div
                        className={styles.modalOverlay}
                        onClick={() => setShowRequests(false)}
                    >
                        <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between"
                                }}
                            >
                                <h3>Friend Requests</h3>

                                <button
                                    onClick={() => setShowRequests(false)}
                                    style={{
                                        backgroundColor: "transparent",
                                        border: "none"
                                    }}
                                ><i
                                    className="fa-solid fa-xmark"
                                    style={{
                                        color: "var(--danger)",
                                        fontSize: "1.06em"
                                    }}
                                ></i></button>
                            </div>

                            <div className={styles.tabs}>
                                <button
                                    className={activeTab === "received" ? styles.activeTab : ""}
                                    onClick={() => setActiveTab("received")}
                                >Received</button>

                                <button
                                    className={activeTab === "sent" ? styles.activeTab : ""}
                                    onClick={() => setActiveTab("sent")}
                                >Sent</button>
                            </div>

                            <hr
                                className={styles.divider}
                                style={{
                                    width: "calc(100%)",
                                    margin: "0px"
                                }}
                            />

                            <div className={styles.requestsList}>
                                {
                                    activeTab === "received"
                                    &&
                                    <>
                                        {
                                            requests_loader
                                                ?
                                                <DivLoader />
                                                :
                                                received.map(r => (
                                                    <div key={r.request_id} className={styles.requestItem}>
                                                        <div
                                                            className={styles.userInfo}
                                                            style={{
                                                                flex: "1",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "flex-start",
                                                                gap: "8px"
                                                            }}
                                                        >
                                                            <img
                                                                src={server_url + "/files/" + r.sender_pfp}
                                                                onError={e => {
                                                                    e.onerror = null;
                                                                    e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png"
                                                                }}
                                                            />

                                                            <h5>{r.sender_name}</h5>
                                                        </div>

                                                        <div>
                                                            <button
                                                                onClick={() => acceptRequest(r.request_id)}
                                                                className={styles.accept}
                                                                style={{
                                                                    backgroundColor: "var(--success-bg)"
                                                                }}
                                                            ><i
                                                                className="fa-solid fa-check"
                                                                style={{
                                                                    color: "var(--success)"
                                                                }}
                                                            ></i></button>

                                                            <button
                                                                onClick={() => rejectRequest(r.request_id)}
                                                                className={styles.reject}
                                                                style={{
                                                                    backgroundColor: "var(--danger-light-bg)"
                                                                }}
                                                            ><i
                                                                className="fa-solid fa-x"
                                                                style={{
                                                                    color: "var(--danger-light)"
                                                                }}
                                                            ></i></button>
                                                        </div>
                                                    </div>
                                                ))
                                        }
                                    </>
                                }

                                {
                                    activeTab === "sent"
                                    &&
                                    <>
                                        {
                                            requests_loader
                                                ?
                                                <DivLoader />
                                                :
                                                sent.map(s => (
                                                    <div key={s.request_id} className={styles.requestItem}>
                                                        <div
                                                            className={styles.userInfo}
                                                            style={{
                                                                flex: "1",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "flex-start",
                                                                gap: "8px"
                                                            }}
                                                        >
                                                            <img
                                                                src={server_url + "/files/" + s.sender_pfp}
                                                                onError={e => {
                                                                    e.onerror = null;
                                                                    e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png"
                                                                }}
                                                            />

                                                            <h5>{s.receiver_name}</h5>
                                                        </div>

                                                        <div
                                                            style={{
                                                                padding: "8px",
                                                                border: "1px solid var(--border-light)",
                                                                backgroundColor: "var(--bg)",
                                                                borderRadius: "8px"
                                                            }}
                                                            className={styles.pending}
                                                        >
                                                            <i
                                                                style={{
                                                                    color: "var(--text-secondary)"
                                                                }}
                                                                className="fa-regular fa-clock"
                                                            ></i>
                                                        </div>
                                                    </div>
                                                ))
                                        }
                                    </>
                                }

                                {
                                    (activeTab === "received" && !requests_loader) && received.length === 0 && (
                                        <div className={styles.emptyState}>
                                            <h5>No requests</h5>
                                        </div>
                                    )
                                }

                                {
                                    (activeTab === "sent" && !requests_loader) && sent.length === 0 && (
                                        <div className={styles.emptyState}>
                                            <h5>No sent requests</h5>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                )
            }

            {
                show_profile
                &&
                <UserProfile
                    user_id={show_profile}
                    closeHook={setShowProfile}
                />
            }
        </div>
    );
}
