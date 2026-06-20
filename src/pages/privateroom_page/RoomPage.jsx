import styles from "./room_page.module.css";
import Rooms from "./Rooms";
import SideBar from "../../reusable_component/SideBar";
import NewRoom from "./CreateRoom";
import { server_url } from '../../configs/server_url';
import { useContext, useEffect, useState } from "react";
import { UiContext } from "../../utils/UiContext";
import { AppContext } from "../../Contexts";
import axios from "axios";

export default function RoomPage() {
    // Room filter
    const { room_filter, setRoomFilter } = useContext(UiContext);

    // App-level vars
    const { user_details, is_loading, setLogOut } = useContext(AppContext);

    // Available rooms
    const [rooms, setRooms] = useState([]);
    const [searched_rooms, setSearchRes] = useState([]);

    // Rooms offset
    const [last_seen_id, setLastSeenId] = useState(Number.MAX_SAFE_INTEGER);
    const [search_last_seen_id, setSearchLastSeenId] = useState(Number.MAX_SAFE_INTEGER);

    // Search rooms functionality state vars:
    const [search_query, setSearchQuery] = useState("");
    const [did_search, setSearched] = useState(false);

    // Create room button click
    const [new_room_triggered, setNRTrigger] = useState(false);

    // Reload the rooms (used only when a room is created)
    const [state, setRefreshState] = useState(0);

    // Show loader
    const [loading, setLoading] = useState(false);

    // Div Loader
    const [div_loader, setDivLoader] = useState(true);

    // Initial rooms load
    useEffect(() => {
        if (!user_details?.id) return;

        loadRooms();
    }, [user_details?.id, room_filter]);

    // Reload the rooms entirely on state change
    useEffect(() => {
        if (state === 0) return;

        const reload = async () => {
            await changeFilter(room_filter);
            loadRooms();
        }

        reload();
    }, [state]);

    // Search rooms call-back:
    useEffect(() => {
        setSearchRes([]);

        if (search_query.trim().length < 1) {
            setLoading(false);
            setSearched(false);
            setLastSeenId(Number.MAX_SAFE_INTEGER);

            return;
        }

        setSearched(true);
        setSearchLastSeenId(Number.MAX_SAFE_INTEGER);
        setLoading(true);

        const query = new AbortController();

        const search = setTimeout(() => {
            searchRooms(
                query,
                user_details?.id || localStorage.getItem("user_id"),
                search_query,
                Number.MAX_SAFE_INTEGER,
                setLogOut,
                setLoading,
                setSearchRes,
                setSearchLastSeenId
            );
        }, 500);

        return () => {
            query.abort();
            clearTimeout(search);
        }
    }, [search_query]);

    // Load rooms
    const loadRooms = async () => {
        setLoading(true);

        try {
            const res = await axios.get(
                `${server_url}/rooms/${room_filter === "my" ? "my-rooms" : "all-rooms"}?user_id=${user_details?.id}&last_seen_id=${last_seen_id}`,
                {
                    headers: {
                        auth_token: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const room_res = res.data.rooms;

            if (!room_res.length && last_seen_id === Number.MAX_SAFE_INTEGER) {
                setLoading(false);
                return;
            }

            const final_list = uniqueList([...rooms, ...room_res]);

            setLastSeenId(room_res[room_res.length - 1]?.r_id);
            setRooms(final_list);
            setLoading(false);
        }
        catch (err) {
            console.log(err);
            setLoading(false);

            if (["INVALID_JWT", "FORBIDDEN"].includes(err.response?.data?.code))
                setLogOut();

            return;
        }
    }

    // Filter toggle logic
    const changeFilter = async (filter) => {
        setRooms([]);
        setLastSeenId(Number.MAX_SAFE_INTEGER);
        await setRoomFilter(filter);
    }

    return (
        <div className={styles.roomsPage}>
            <SideBar
                location="/rooms"
                active_page="privaterooms"
            />

            <div className={styles.mainLayout}>
                <div className={styles.header}>
                    <div className={styles.heading}>
                        <h2>Rooms</h2>
                    </div>

                    <button
                        className={"utilBtn"}
                        onClick={() => setNRTrigger(true)}
                    ><i className="fa-solid fa-plus"></i> <span>Create</span> Room</button>
                </div>

                <div className={styles.body}>
                    <div className={styles.searchRooms}>
                        <div className={styles.searchBar}>
                            <div><i className="fa-solid fa-magnifying-glass"></i></div>

                            <input
                                value={search_query}
                                type="text"
                                placeholder="Search by room name, admin..."
                                onChange={e => {
                                    setSearchQuery(e.target.value);
                                }}
                            />
                        </div>

                        {
                            !did_search
                            &&
                            <div className={styles.filter}>
                                <button
                                    className={
                                        `
                                        ${styles.my}
                                        ${room_filter === "my" && styles.activeBtn} 
                                        ${styles.filterBtn}
                                        `
                                    }
                                    onClick={() => {
                                        if (room_filter === "my")
                                            return;

                                        changeFilter("my");
                                    }}
                                >My Rooms</button>

                                <button
                                    className={
                                        `
                                        ${styles.all}
                                        ${room_filter === "all" && styles.activeBtn} 
                                        ${styles.filterBtn}
                                        `
                                    }
                                    onClick={() => {
                                        if (room_filter === "all")
                                            return;

                                        changeFilter("all");
                                    }}
                                >All Rooms</button>
                            </div>
                        }
                    </div>

                    <div className={styles.rooms}>
                        {
                            (did_search ? searched_rooms : rooms)
                                .filter(room => room.r_type !== "private")
                                .map(room => (
                                    <Rooms
                                        key={room.r_id}
                                        room_id={room.r_id}
                                        logo={`${server_url}/files/${room.icon_url}`}
                                        room_title={room.r_name}
                                        prof_name={
                                            room.r_aid == user_details?.id
                                                ? "You"
                                                : capitalize(room.username)
                                        }
                                        join={true}
                                        join_pref={capitalize(room.join_pref)}
                                        is_member={room.is_member}
                                        room_btn={room_filter === "my" ? "Open Room" : "View Room"}
                                    />
                                ))
                        }
                    </div>

                    <div className={styles.loaderDiv}>
                        {
                            !did_search
                                ?
                                (!loading && (!rooms.length))
                                &&
                                <h5>{
                                    room_filter === "my"
                                        ? "Looks like you're not in any rooms yet. Join or create one to begin."
                                        : "There are no rooms available right now."
                                }</h5>

                                :
                                (!loading && !searched_rooms.length)
                                &&
                                <h5>There are no rooms available right now.</h5>
                        }

                        {
                            loading
                            &&
                            <div className={styles.loader}></div>
                        }
                    </div>
                </div>
            </div>

            {
                new_room_triggered &&
                <div className={styles.newRoomDiv}>
                    <NewRoom
                        setRefreshState={setRefreshState}
                        closeHook={setNRTrigger}
                    />
                </div>
            }
        </div>
    );
}

const uniqueList = (list) => ([...new Map(list.map(item => [item.r_id, item])).values()])

const capitalize = (string) => string?.charAt(0).toUpperCase() + string?.slice(1);

const searchRooms = (query, user_id, search_query, last_seen_id, setLogOut, setLoading, setSearchRes, setSearchLastSeenId) => {
    axios.get(
        server_url + `/rooms/search?user_id=${user_id}&search_query=${search_query}&last_seen_id=${last_seen_id}`,
        {
            signal: query.signal,
            headers: {
                auth_token: `Bearer ${localStorage.getItem("token")}`
            }
        }
    ).then(res => {
        setSearchRes(prev => uniqueList([...prev, ...res.data?.rooms]));
        setLoading(false);
        setSearchLastSeenId(prev => res.data?.rooms[res.data?.rooms?.length - 1]?.r_id || prev);
    }).catch(err => {
        console.log(err);

        if (["INVALID_JWT", "FORBIDDEN"].includes(err?.response?.data?.code))
            setLogOut();

        setSearchRes([]);
    });
}