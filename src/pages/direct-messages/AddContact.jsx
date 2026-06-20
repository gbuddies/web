import { useState } from "react";
import styles from "./addcontact.module.css";
import { server_url } from '../../configs/server_url';
import Friend from "../../reusable_component/friend_div/Friend";
import { useEffect } from "react";
import DivLoader from "../loading_screen/DivLoader";
import axios from "axios";
import { useContext } from "react";
import { AppContext } from "../../Contexts";
import { DMContext } from "../../utils/DMContext";
import createContact from "./CreateContact";
import PageLoader from "../loading_screen/PageLoader";

export default function AddContact(props) {
    const [search_query, setSearchQuery] = useState("");
    const user_details = useContext(AppContext);

    // To set loader
    const [loading, setLoading] = useState(true);
    const [page_loader, setPageLoader] = useState(true);

    // To toggle between search & all
    const [searched, setSearched] = useState(false);

    // To store the friends
    const [friends, setFriends] = useState([]);

    // To store the recent connections
    const [recents, setRecents] = useState([]);

    // To store last received contact id
    const [last_seen_id, setLastSeenId] = useState(Number.MAX_SAFE_INTEGER);

    // To get the recent connections
    useEffect(() => {
        axios.get(
            `${server_url}/users/recent-friends?user_id=${user_details?.id || sessionStorage.getItem("user_id")}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).then(res => {
            setRecents(res.data.recents);
        }).catch(err => {
            console.error(err);

            if (["INVALID_JWT", "FORBIDDEN"].includes(err.response?.data?.code))
                setLogOut();
        });
    }, []);

    // To get all the friends
    useEffect(() => {
        if (searched) return;

        setLoading(true);

        axios.get(
            `${server_url}/users/friends?user_id=${user_details?.id || sessionStorage.getItem("user_id")}&last_seen_id=${last_seen_id}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).then(res => {
            const friends = res.data.friends;
            setFriends(friends);
            setLoading(false);
            setLastSeenId(friends[friends.length - 1]?.id || Number.MAX_SAFE_INTEGER);
            setPageLoader(false);
        }).catch(err => {
            console.error(err);

            if (["INVALID_JWT", "FORBIDDEN"].includes(err.response?.data?.code))
                setLogOut();

            setLoading(false);
        });
    }, [searched]);

    // To get the searched friends
    useEffect(() => {
        if (search_query.trim().length == 0) {
            setSearched(false);
            setLoading(false);
            setLastSeenId(Number.MAX_SAFE_INTEGER);
            return;
        }

        setFriends([]);
        setSearched(true);
        setLoading(true);

        const query = new AbortController();

        const search = setTimeout(() => {
            axios.get(
                server_url + `/users/search/friends?user_id=${user_details?.id || sessionStorage.getItem("user_id")}&query=${search_query}&last_seen_id=${Number.MAX_SAFE_INTEGER}`,
                {
                    signal: query.signal,
                    headers: {
                        auth_token: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            ).then(res => {
                const search_res = res.data.search_res;
                setFriends(search_res);
                setLoading(false);
                setLastSeenId(search_res[search_res.length - 1]?.id || Number.MAX_SAFE_INTEGER);
            }).catch(err => {
                console.log(err);

                if (["INVALID_JWT", "FORBIDDEN_ACCESS"].includes(err.response?.data?.code))
                    setLogOut();
            });
        }, 500);

        return () => {
            query.abort();
            clearTimeout(search);
        };
    }, [search_query]);

    return (
        <div className={styles.addContact}>
            <div
                style={{
                    width: "100%",
                    height: "auto",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}
            >
                <h2>Add Contact</h2>

                <button
                    style={{
                        backgroundColor: "transparent",
                        outline: "none",
                        border: "none"
                    }}
                    onClick={() => props.setAddContact(false)}
                >
                    <i
                        style={{
                            color: "var(--danger)",
                            fontSize: "1.25em"
                        }}
                        className="fa-solid fa-xmark"
                    ></i>
                </button>
            </div>

            {
                page_loader
                    ?
                    <PageLoader />
                    :
                    <>
                        {
                            recents.length > 0
                                ?
                                <>
                                    <h4>Recent Connections</h4>

                                    <div className={styles.recentFriends}>
                                        {
                                            recents.map(recent => (
                                                <RecentFriend
                                                    key={recent.friend_id}
                                                    user_id={user_details?.id || sessionStorage.getItem("user_id")}
                                                    friend_id={recent.friend_id}
                                                    url={recent.pfp}
                                                    username={recent.username}
                                                    props={props}
                                                />
                                            ))
                                        }
                                    </div>
                                </>
                                :
                                <div></div>
                        }

                        < hr className={styles.divider} />

                        <div className={styles.searchBar}>
                            <div><i className="fa-solid fa-magnifying-glass"></i></div>

                            <input
                                type="text"
                                value={search_query}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search for friends..."
                            />
                        </div>

                        {
                            loading
                                ?
                                <DivLoader />
                                :
                                <>
                                    {!searched && <h4>Friends</h4>}

                                    <div className={styles.friends}>
                                        {
                                            friends.length > 0
                                                ?
                                                friends.map(frnd => (
                                                    <Friend
                                                        key={frnd.friend_id}
                                                        ruse="add-contact"
                                                        user_id={user_details?.id || sessionStorage.getItem("user_id")}
                                                        friend_id={frnd.friend_id}
                                                        url={frnd.pfp}
                                                        username={frnd.username}
                                                        props={props}
                                                    />
                                                ))
                                                :
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "4px"
                                                    }}
                                                >
                                                    <h5>You have no friends.</h5>
                                                    <h5>Add friends to start messaging.</h5>
                                                </div>
                                        }
                                    </div>
                                </>
                        }
                    </>
            }
        </div>
    );
}

function RecentFriend({ user_id, friend_id, url, username, props }) {
    // Here user_id is the id of current user not of their friend

    // Required Global functions
    const {
        setChatSelected,
        setLoading,
        setSelectedCID,
        setContactDetails,
        setAddContact
    } = useContext(DMContext);

    return (
        <div className={styles.block}
            onClick={async () => {
                const c_det = await createContact(user_id, friend_id, props);
                await setChatSelected(true);
                setLoading(true);
                await setSelectedCID(Number(c_det?.contact_id));
                await setContactDetails({
                    username: c_det?.username,
                    pfp: c_det?.pfp
                });
                setAddContact(false);
            }}
        >
            <div className={styles.pfp}>
                <img
                    src={server_url + `/files/${url}`}
                    alt={username}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                            "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                    }}
                />
            </div>

            <h5 className={styles.username}>{username}</h5>
        </div>
    );
}