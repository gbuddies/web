import { useState, useEffect, useContext } from "react";
import { server_url } from '../../configs/server_url.js';
import createContact from "../../pages/direct-messages/CreateContact";
import styles from "./friend.module.css";
import { useRef } from "react";
import { DMContext } from "../../utils/DMContext";
import { AppContext } from "../../Contexts";
import { useNavigate } from "react-router-dom";

export default function Friend(props) {
    const {
        ruse,
        user_id,
        friend_id,
        url,
        username,
        ...rem_props
    } = props;

    const { user_details } = useContext(AppContext);
    const navigate = useNavigate();

    // Required Global functions
    const {
        setChatSelected,
        setLoading,
        setSelectedCID,
        setContactDetails,
        setAddContact
    } = useContext(DMContext);

    // ruse -> where this div is being used
    // user_id -> id of current user's friend
    // friend_id -> id of relation
    // url -> pfp name of friend
    // username -> name of friend
    // rem_props -> required utilities

    const [show_actions, setShowActions] = useState(false);
    const friend_ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (friend_ref.current && !friend_ref.current.contains(e.target)) {
                setShowActions(false);
            }
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    switch (ruse) {
        case "add-contact":
            return (
                <div className={styles.friend}
                    key={friend_id}
                    onClick={async () => {
                        const c_det = await createContact(user_id, friend_id, rem_props);
                        await setChatSelected(true);
                        setLoading(true);
                        await setSelectedCID(Number(c_det?.contact_id));
                        await setContactDetails({
                            username: c_det?.username,
                            pfp: c_det?.pfp
                        });
                        await setAddContact(false);
                    }}
                >
                    <div className={styles.pfp}>
                        <img src={server_url + "/files/" + url}
                            onError={e => {
                                e.target.onerror = null;
                                e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                            }}
                        />
                    </div>

                    <div className={styles.name}>
                        <h5>{username}</h5>
                    </div>
                </div>
            );

        case "friends":
            // needs these rem_props:
            // 
            return (
                <div
                    key={friend_id}
                    ref={friend_ref}
                    className={styles.friend}
                    onClick={() => setShowActions(true)}
                >
                    <div className={styles.pfp}>
                        <img src={server_url + "/files/" + url}
                            onError={e => {
                                e.target.onerror = null;
                                e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                            }}
                        />
                    </div>

                    <div className={styles.name}>
                        <h5
                            style={{
                                display: show_actions ? "none" : "flex"
                            }}
                        >{username}</h5>
                    </div>

                    <div
                        className={`${styles.action} ${show_actions ? styles.actionVisible : ""}`}
                    >
                        <button
                            onClick={async e => {
                                e.stopPropagation();
                                const c_det = await createContact(user_details?.id || sessionStorage.getItem("user_id"), friend_id, rem_props);
                                await setChatSelected(true);
                                setLoading(true);
                                await setSelectedCID(Number(c_det?.contact_id));
                                await setContactDetails({
                                    username: c_det?.username,
                                    pfp: c_det?.pfp
                                });
                                
                                navigate("/direct-messages");
                            }}
                        ><i className="fa-solid fa-message"></i></button>

                        <button
                            onClick={e => {
                                e.stopPropagation();
                                rem_props.setShowProfile(user_id);
                            }}
                        ><i className="fa-solid fa-circle-user"></i></button>

                        <button
                            style={{
                                backgroundColor: "var(--danger-light-bg)"
                            }}
                            onClick={e => {
                                e.stopPropagation();
                                rem_props.removeFriend(friend_id);
                            }}
                        ><i
                            style={{
                                color: "var(--danger-light)"
                            }}
                            className="fa-solid fa-user-minus"
                        ></i></button>
                    </div>
                </div>
            );

        case "searched_friend":

            return (
                <div
                    key={friend_id}
                    ref={friend_ref}
                    className={styles.friend}
                    onClick={() => setShowActions(true)}
                >
                    <div className={styles.pfp}>
                        <img src={server_url + "/files/" + url}
                            onError={e => {
                                e.target.onerror = null;
                                e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                            }}
                        />
                    </div>

                    <div className={styles.name}>
                        <h5
                            style={{
                                display: show_actions ? "none" : "flex"
                            }}
                        >{username}</h5>
                    </div>

                    <div
                        className={`${styles.action} ${show_actions ? styles.actionVisible : ""}`}
                    >
                        {
                            rem_props.is_friend
                                ?
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                    }}
                                ><i className="fa-solid fa-message"></i></button>
                                :
                                <></>
                        }

                        <button
                            onClick={e => {
                                e.stopPropagation();
                                rem_props.setShowProfile(user_id);
                            }}
                        ><i className="fa-solid fa-circle-user"></i></button>

                        {
                            rem_props.is_friend
                                ?
                                <button
                                    style={{
                                        backgroundColor: "var(--danger-light-bg)"
                                    }}
                                    onClick={e => {
                                        e.stopPropagation();
                                        rem_props.removeFriend(friend_id);
                                    }}
                                ><i
                                    style={{
                                        color: "var(--danger-light)"
                                    }}
                                    className="fa-solid fa-user-minus"
                                ></i></button>
                                :
                                rem_props.is_pending
                                    ?

                                    <div
                                        style={{
                                            padding: "9px 8px",
                                            border: "1px solid var(--border-light)",
                                            backgroundColor: "var(--bg)",
                                            borderRadius: "8px",
                                            margin: "0",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
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
                                    :
                                    <button
                                        style={{
                                            backgroundColor: "var(--primary-bg)"
                                        }}
                                        onClick={e => {
                                            e.stopPropagation();
                                            rem_props.sendRequest(user_id, username, url);
                                        }}
                                    ><i
                                        style={{
                                            color: "var(--accent)"
                                        }}
                                        className="fa-solid fa-user-plus"
                                    ></i></button>
                        }
                    </div>
                </div>
            );
    }
}