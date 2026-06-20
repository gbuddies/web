import styles from "./dm.module.css";
import SideBar from "../../reusable_component/SideBar";
import { server_url } from '../../configs/server_url';
import { AppContext } from "../../Contexts";
import { DateStamp, Message } from "../../reusable_component/message_dev/Message";
import { useContext, useRef } from "react";
import axios from "axios";
import MessageBar from "../../reusable_component/message_bar/MessageBar";
import FileObject from "../../reusable_component/file_object/FileObject";
import EmojiBox from "../../reusable_component/emoji_box/EmojiBox";
import { useState } from "react";
import { useEffect } from "react";
import DivLoader from "../loading_screen/DivLoader";
import AddContact from "./AddContact";
import { File } from "../../reusable_component/message_dev/Message";
import PageLoader from "../loading_screen/PageLoader";
import eposhToString from "../../reusable_component/util_funcs/EpochToReadable";
import { DMContext } from "../../utils/DMContext";

export default function DM() {
    const { user_details, socket, setLogOut } = useContext(AppContext);
    const bottom_ref = useRef(null);
    const input_ref = useRef(null);
    const search_ref = useRef(null);

    // Required Global functions
    const {
        chat_selected,
        setChatSelected,
        is_loading,
        setLoading,
        selected_contactID,
        setSelectedCID,
        contact_details,
        setContactDetails,
        add_contact,
        setAddContact
    } = useContext(DMContext);

    // Contct load placeholder
    const [chat_loader, setChatLoader] = useState(true);

    // To toggle between chats & search chats
    const [searched, setSearched] = useState(false);

    // Search vals
    const [search_query, setSearchQuery] = useState("");

    // To set all messages
    const [messages, setMessages] = useState([]);

    // To set current message
    const [message, setMessage] = useState("");

    // To set chat contacts
    const [chats, setChats] = useState([]);

    // To set last contact id
    const [last_seen_con, setLastSeenCon] = useState(Number.MAX_SAFE_INTEGER);

    // File Picker:
    const [show_file_object, setShowFileObject] = useState(false);
    const [files, setFiles] = useState([]);

    // File input handler:
    const handleFiles = (e) => {
        setFiles(Array.from(e.target.files));
        setShowFileObject(true);
        input_ref?.current?.focus();
    }

    // Emoji Picker:
    const [show_picker, setShowPicker] = useState(false);

    // Emoji picker call-back:
    const setEmoji = (emoji_data) => {
        setMessage(prev => prev + emoji_data.emoji);
        input_ref?.current?.focus();
    }

    // To get to the bottom of the chats
    useEffect(() => {
        bottom_ref?.current?.scrollIntoView();
    }, [messages]);

    // To get all the contacts of the user
    useEffect(() => {
        if (searched) return;

        setLoading(true);

        axios.get(
            server_url + `/messages/contacts?user_id=${user_details?.id || sessionStorage.getItem("user_id")}&last_seen=${last_seen_con}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).then(res => {
            const data = res.data;
            setChats(data.contacts);
            setLoading(false);
        }).catch(err => {
            console.log(err);

            if (["INVALID_JWT", "FORBIDDEN_ACCESS"].includes(err.response?.data?.code))
                setLogOut();

            setLoading(false);
        });
    }, [searched, add_contact]);

    // To fetch all the messages of a particular contact
    useEffect(() => {
        if (!chat_selected || !selected_contactID) return;

        input_ref?.current?.focus();
        setChatLoader(true);

        axios.get(
            server_url + `/messages/chats?user_id=${user_details?.id || sessionStorage.getItem("user_id")}&contact_id=${selected_contactID}&last_seen_id=${Number.MAX_SAFE_INTEGER}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).then(res => {
            const data = res.data;
            setMessages(data.chats);
            setChatLoader(false);
        }).catch(err => {
            console.log(err);

            if (["INVALID_JWT", "FORBIDDEN_ACCESS"].includes(err.response?.data?.code))
                setLogOut();
        });
    }, [selected_contactID]);

    // To open socket room with selected contact
    useEffect(() => {
        if (!socket || !selected_contactID) return;

        socket.emit("connect-dm", { contact_id: selected_contactID });

        return () => {
            socket.emit("disconnect-dm", { contact_id: selected_contactID });
        }
    }, [socket, selected_contactID]);

    // To get the messages when active
    useEffect(() => {
        if (!socket || !selected_contactID) return;

        const handleMessage = (res) => {
            if (user_details?.id === Number(res.sender_details.sender_id))
                return;

            setMessages(
                prev => [...prev, res]
            );
        };

        socket.on("get-dm", handleMessage);

        return () => {
            socket.off("get-dm", handleMessage);
        }
    }, [socket, selected_contactID]);

    // Search contacts
    useEffect(() => {
        if (search_query.trim().length < 1) {
            setChats([]);
            setSearched(false);
            setLastSeenCon(Number.MAX_SAFE_INTEGER);

            return;
        }

        setChats([]);
        setSearched(true);
        setLastSeenCon(Number.MAX_SAFE_INTEGER);
        setLoading(true);

        const query = new AbortController();

        const search = setTimeout(() => {
            axios.get(
                server_url + `/messages/search/contacts?user_id=${user_details?.id || sessionStorage.getItem("user_id")}&query=${search_query}&last_seen_id=${Number.MAX_SAFE_INTEGER}`,
                {
                    signal: query.signal,
                    headers: {
                        auth_token: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            ).then(res => {
                const contacts = res.data.contacts;

                setChats(contacts);
                setLoading(false);
                setLastSeenCon(contacts[contacts.length - 1]?.contact_id || Number.MAX_SAFE_INTEGER);
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

    // Send message + optimistic UI update
    const sendMessage = async () => {
        if (!message.trim() && files.length === 0) {
            setMessage("");
            setFiles([]);
            input_ref.current?.style && (input_ref.current.style.height = "auto");
            input_ref.current?.focus();

            return;
        }

        const msg_id = generateUUID();

        const local_message = {
            msg_id,
            identifiers: {
                message_id: null,
                contact_id: selected_contactID
            },
            sender_details: {
                sender_id: user_details?.id || sessionStorage.getItem("user_id"),
                sender_name: user_details?.username,
                sender_pfp: user_details?.pfp
            },
            text: message.trim(),
            files_list: files.map(file => ({ filename: file.name, file_url: null })),
            timestamp: null,
            status: "pending"
        };

        setMessages(
            prev => [...prev, local_message]
        );

        setMessage("");
        setShowPicker(false);

        const form = new FormData();

        files.forEach(file => form.append("files", file));
        let files_list = [];

        setFiles([]);
        setShowFileObject(false);

        document.getElementById("file").value = "";

        try {
            const res = await axios.post(
                `${server_url}/files/upload?user_id=${user_details?.id || sessionStorage.getItem("user_id")}`,
                form,
                {
                    headers: {
                        auth_token: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            files_list = res.data.files_list;
        }
        catch (err) {
            console.log(err);

            if (["INVALID_JWT", "FORBIDDEN_ACCESS"].includes(err.response?.data?.code))
                setLogOut();
        }

        const message_form = {
            msg_id,
            identifiers: {
                message_id: null,
                contact_id: selected_contactID
            },
            sender_details: {
                sender_id: user_details?.id || sessionStorage.getItem("user_id"),
                sender_name: user_details?.username,
                sender_pfp: user_details?.pfp
            },
            text: local_message.text,
            files_list
        };

        socket.emit("send-dm", { message_form, contact_id: selected_contactID });

        input_ref.current?.focus();
        input_ref.current.style.height = "auto";
    };

    useEffect(() => {
        if (!socket) return;

        const handleFailedMessages = (res) => {
            setMessages(prev =>
                prev.map(message => (
                    message.msg_id === res.msg_id
                        ?
                        {
                            ...message,
                            status: "failed"
                        }
                        :
                        message
                ))
            );
        };

        const updateMsgs = (res) => {
            setMessages(prev => (
                prev.map(message => (
                    message.msg_id === res.msg_id
                        ?
                        {
                            ...message,
                            timestamp: res.timestamp,
                            status: "complete",
                            files_list: res.files_list
                        }
                        :
                        message
                ))
            ));
        };

        socket.on("socket_error", handleFailedMessages);
        socket.on("dm_emit-success", updateMsgs);

        return () => {
            socket.off("socket_error", handleFailedMessages);
            socket.off("dm_emit-success", updateMsgs);
        };
    }, [socket, selected_contactID]);

    // To hide chat panel on smaller screens
    const [show_contacts, setShowContacts] = useState(false);

    // To hide Message bar and Person control bar
    const [hide_bars, setHideBars] = useState(false);

    useEffect(() => {

        if (add_contact) return;

        setHideBars(false);
    }, [add_contact]);

    return (
        <div className={styles.dmDashboard}>
            {
                show_contacts
                &&
                <div
                    className={styles.backDrop}
                    onClick={() => setShowContacts(prev => !prev)}
                ></div>
            }

            <SideBar
                active_page="dms"
                location="/direct-messages"
            />

            {
                chat_selected
                    ?
                    <div className={styles.chatPage}>
                        {
                            hide_bars
                                ?
                                <></>
                                :
                                <div className={styles.personControlBar}>
                                    <div className={styles.person_info}>
                                        <img
                                            src={server_url + `/files/${contact_details.pfp}`}
                                            onError={(e) => {
                                                e.target.onError = null;
                                                e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                                            }}
                                        />

                                        <h3>{contact_details.username}</h3>
                                    </div>
                                </div>
                        }

                        <div className={styles.chatContainer}>
                            {
                                chat_loader
                                    ?
                                    <PageLoader />
                                    :
                                    messages.length ?
                                        messages.map((msg, index) => {
                                            const day_string = eposhToString(msg.timestamp);

                                            const prev = messages[index - 1];
                                            const prev_day = prev ? eposhToString(prev.timestamp) : null;

                                            const show = day_string !== prev_day;

                                            return <div key={msg.msg_id || msg.identifiers.message_id}>
                                                {
                                                    msg.status === "pending"
                                                        ? prev_day !== "Today" && <DateStamp day="Today" />
                                                        : show && <DateStamp day={day_string} />
                                                }

                                                {
                                                    msg.files_list.map((file, file_index) => (
                                                        <File
                                                            key={`${msg.msg_id || msg.identifiers.message_id}-${file.filename}`}
                                                            constraint={"no-logo"}
                                                            sender_id={msg.sender_details.sender_id}
                                                            sender_name={msg.sender_details.sender_name}
                                                            sender_pfp={msg.sender_details.sender_pfp}
                                                            filename={file.filename}
                                                            file_url={file.file_url}
                                                            timestamp={msg.timestamp}
                                                            status={msg.status || "complete"}
                                                        />
                                                    ))
                                                }

                                                {
                                                    msg.text
                                                    &&
                                                    <Message
                                                        key={msg.msg_id || msg.identifiers.message_id}
                                                        constraint={"no-logo"}
                                                        message={msg.text}
                                                        sender_id={msg.sender_details.sender_id}
                                                        sender_name={msg.sender_details.sender_name}
                                                        sender_pfp={msg.sender_details.sender_pfp}
                                                        timestamp={msg.timestamp}
                                                        files={msg.files_list}
                                                        status={msg.status || "complete"}
                                                    />
                                                }
                                            </div>
                                        }) :
                                        <div className={styles.noMsgs}><h5>No Recent Messages</h5></div>
                            }

                            <div ref={bottom_ref}></div>
                        </div>

                        {
                            show_file_object
                            &&
                            <FileObject
                                files={files}
                            />
                        }

                        {
                            hide_bars
                                ?
                                <></>
                                :
                                <MessageBar
                                    setShowPicker={setShowPicker}
                                    handleFiles={handleFiles}
                                    input_ref={input_ref}
                                    message={message}
                                    setMessage={setMessage}
                                    sendMessage={sendMessage}
                                    style={{
                                        position: "sticky"
                                    }}
                                />}

                        {
                            show_picker
                            &&
                            <div className={styles.emojiPicker}>
                                <EmojiBox
                                    setEmoji={setEmoji}
                                />
                            </div>
                        }
                    </div>
                    :
                    <div className={styles.noConv}>
                        <img src="https://cdn-icons-png.flaticon.com/512/2903/2903501.png" alt="" />

                        <h3>Select a conversation</h3>

                        <h5>Choose a contact to start messaging.</h5>
                    </div>
            }

            <div className={`${styles.messages} ${show_contacts ? styles.showContacts : ""}`}>
                <div className={styles.header}>
                    <h2>Contacts</h2>

                    <button
                        onClick={() => setShowContacts(false)}
                    ><i className="fa-solid fa-xmark"></i></button>
                </div>

                <div className={styles.searchBar}>
                    <div><i className="fa-solid fa-magnifying-glass"></i></div>

                    <input
                        type="text"
                        value={search_query}
                        ref={search_ref}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search for contacts..."
                    />
                </div>

                <hr className={styles.divider} />

                {
                    is_loading
                        ?
                        <DivLoader />
                        :
                        <>
                            <div className={styles.contacts}>
                                {
                                    chats.length
                                        ?
                                        chats.map((chat, index) => (
                                            <Contact
                                                key={chat.contact_id}
                                                setChatSelected={setChatSelected}
                                                setSelectedCID={setSelectedCID}
                                                setContactDetails={setContactDetails}
                                                setShowContacts={setShowContacts}
                                                selected_CID={selected_contactID}
                                                contact_id={chat.contact_id}
                                                pfp={chat.pfp}
                                                username={chat.username}
                                                recent_message={chat.recent_message || ""}
                                                timestamp={chat.sent_at}
                                                transaction={
                                                    chat.sent_by == (user_details?.id || localStorage.getItem("user_id")) ? 1 : 0
                                                }
                                                unread_msg={chat.unread_msgs}
                                            />
                                        ))
                                        :
                                        <div className={styles.noChats}>
                                            <h5>No Chats Available</h5>
                                            <h5>But that just means a fresh start! Start connecting with your friends today.</h5>
                                        </div>
                                }

                                <div className={styles.buffer}></div>
                            </div>
                        </>
                }

                <div
                    className={styles.newContact}
                    onClick={() => {
                        setHideBars(true);
                        setShowContacts(false);
                        setAddContact(true);
                    }}
                >
                    <i className="fa-solid fa-plus"></i>
                </div>
            </div>

            <div className={styles.messagesCollapsed}>
                <div>
                    <button
                        onClick={() => {
                            setShowContacts(true);
                            search_ref?.current?.focus();
                            setSearched(true);
                        }}
                    ><i className="fa-solid fa-magnifying-glass"></i></button>

                    <button
                        onClick={() => setShowContacts(true)}
                    ><i className="fa-solid fa-address-book"></i></button>
                </div>

                <button
                    onClick={() => {
                        setHideBars(true);
                        setAddContact(true);
                    }}
                ><i className="fa-solid fa-plus"></i></button>
            </div>

            {
                add_contact
                &&
                <div className={styles.addContactScreen}>
                    <AddContact
                        setAddContact={setAddContact}
                        setShowContacts={setShowContacts}
                    />
                </div>
            }
        </div>
    );
}

function Contact(props) {

    const formatTime = (time) => {
        if (!time) return "";

        const date = new Date(time);
        if (isNaN(date.getTime())) return "";

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    return (
        <div
            className={`
                ${styles.contact}
                ${props.selected_CID == props.contact_id && styles.selectedContact}
            `}
            onClick={() => {
                props.setChatSelected(true);
                props.setSelectedCID(props.contact_id);
                props.setContactDetails({
                    username: props.username,
                    pfp: props.pfp
                });
                props.setShowContacts(false);
            }}
        >
            <div className={styles.details}>
                <img
                    src={server_url + `/files/${props.pfp}`}
                    onError={(e) => {
                        e.target.onError = null;
                        e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                    }}
                />

                <div>
                    <h4>{props.username}</h4>

                    <h5>
                        {
                            props.selected_CID != props.contact_id &&
                            (
                                props.transaction
                                    ? "You: " + props.recent_message
                                    : props.recent_message
                            )
                        }
                    </h5>
                </div>
            </div>

            <div className={styles.meta}>
                {
                    props.timestamp
                        ? <p>{formatTime(props.timestamp)}, {eposhToString(props.timestamp)}</p>
                        : <p>Recent Contact</p>
                }

                {props.unread_msg && <div></div>}
            </div>
        </div>
    );
}

const generateUUID = () => {
    if (crypto?.randomUUID) {
        return crypto.randomUUID();
    }

    // fallback
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
};