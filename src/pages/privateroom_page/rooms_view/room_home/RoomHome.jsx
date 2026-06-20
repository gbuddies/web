import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";

import SideBar from "../../../../reusable_component/SideBar";
import styles from "./room_home.module.css";
import { server_url } from '../../../../configs/server_url';
import { AppContext } from "../../../../Contexts";
import { File, Message, DateStamp } from "../../../../reusable_component/message_dev/Message";
import EmojiBox from "../../../../reusable_component/emoji_box/EmojiBox";
import FileObject from "../../../../reusable_component/file_object/FileObject";
import MessageBar from "../../../../reusable_component/message_bar/MessageBar";
import PageLoader from "../../../loading_screen/PageLoader";
import eposhToString from "../../../../reusable_component/util_funcs/EpochToReadable";

export default function RoomHome() {
    // To set the loader screen until the data loads
    const [loader, setLoader] = useState(true);

    // Ref to auto scroll to bottom of the messages
    const bottom_ref = useRef(null);

    // Ref to control the message input
    const input_ref = useRef(null);

    const { socket, user_details, setLogOut } = useContext(AppContext);
    const { room_id } = useParams();
    const navigate = useNavigate();

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [room_data, setRoomData] = useState({});

    // Controls opening sidebar at lower sreen width
    const [sidebar_view, setSidebarView] = useState(true);

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

    // To control sidebar visibility, input focus, input height
    useEffect(() => {
        setSidebarView(window.innerWidth >= 560);
        input_ref?.current?.focus();
    }, []);

    // To fetch the room details
    useEffect(() => {
        axios.get(
            server_url + `/rooms/get-room?user_id=${user_details?.id || sessionStorage.getItem("user_id")}&room_id=${room_id}`,
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
    }, [room_id]);

    // To send join room signal to server side socket
    useEffect(() => {
        if (!socket || !room_id) return;

        socket.emit("join-room", { room_id });

        return () => {
            socket.emit("leave-room", { room_id });
        };
    }, [socket, room_id]);

    // To receive the messages sent when active
    useEffect(() => {
        if (!socket || !room_id) return;

        const handleMessage = (res) => {
            if (user_details?.id === Number(res.sender_details.sender_id)) {
                return;
            }

            setMessages(
                prev => [...prev, res]
            );
        };

        socket.on("get-room-message", handleMessage);

        return () => {
            socket.off("get-room-message", handleMessage);
        };
    }, [socket, room_id, user_details.id]);

    // To fetch all the messages of the room at startup
    useEffect(() => {
        if (!room_id) return;

        axios.get(
            server_url + `/messages/room?user_id=${user_details?.id || sessionStorage.getItem("user_id")}&room_id=${room_id}&last_seen_msg=${Number.MAX_SAFE_INTEGER}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        )
            .then(res => setMessages(res.data?.messages || []))
            .catch((err) => {
                console.log(err);

                if (["INVALID_JWT", "FORBIDDEN_ACCESS"].includes(err.response?.data?.code))
                    setLogOut();
            });
    }, [room_id]);

    // Get to the bottom of the messages everytime {messages} changes
    useEffect(() => {
        bottom_ref?.current?.scrollIntoView();
    }, [messages]);

    // Send message + optimistic UI update
    const sendMessage = async () => {
        if (!message.trim() && files.length === 0) {
            setMessage("");
            setFiles([]);
            input_ref.current.style.height = "auto";
            input_ref.current?.focus();

            return;
        }

        const msg_id = generateUUID();

        const local_message = {
            msg_id,
            identifiers: {
                message_id: null,
                room_id
            },
            sender_details: {
                sender_id: user_details?.id || localStorage.getItem("user_id"),
                sender_name: user_details?.username,
                sender_pfp: user_details?.pfp
            },
            text: message.trim(),
            files_list: files.map(file => ({ filename: file.name, file_url: null })),
            timestamp: null,
            status: "pending"
        };

        setMessages(prev => [...prev, local_message]);

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
                room_id
            },
            sender_details: {
                sender_id: user_details?.id || localStorage.getItem("user_id"),
                sender_name: user_details?.username,
                sender_pfp: user_details?.pfp
            },
            text: local_message.text,
            files_list
        };

        socket.emit("send-room-message", { message_form, room_id });

        input_ref.current?.focus();
        input_ref.current.style.height = "auto";
    }

    useEffect(() => {
        if (!socket) return;

        const handleFailedMessages = (res) => {
            setMessages(prev => {
                prev.map((message) => (
                    message.msg_id === res.msg_id
                        ?
                        {
                            ...message,
                            status: "failed"
                        }
                        :
                        message
                ))
            });
        }

        const updateMsgs = (res) => {
            setMessages(prev =>
                prev.map((message) => (
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
            );
        }

        socket.on("socket_error", handleFailedMessages);
        socket.on("room_message_emit-success", updateMsgs);

        return () => {
            socket.off("socket_error", handleFailedMessages);
            socket.off("room_message_emit-success", updateMsgs);
        }
    }, [socket]);

    useEffect(() => {
        if (!Object.keys(room_data).length) return;

        setLoader(false);
    }, [room_data]);

    return (
        <div className={styles.chatpage}>
            {
                sidebar_view &&
                <SideBar
                    className={styles.sidebar}
                    location="/rooms"
                    active_page="privaterooms"
                />
            }

            {
                loader
                    ?
                    <PageLoader />
                    :
                    <div className={styles.chatContext}>
                        <div className={styles.chatWindow}>
                            <div className={styles.roomControlBar}>
                                <button
                                    className={styles.backBtn}
                                    onClick={() => navigate("/rooms")}
                                >
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>

                                <div className={styles.room_info}
                                    onClick={() => {
                                        if (window.innerWidth > 490) return;

                                        navigate(
                                            `/room/dashboard/${room_id}`,
                                            {
                                                state: {
                                                    from: `/room/home/${room_id}`
                                                }
                                            }
                                        );
                                    }}
                                >
                                    <img
                                        src={server_url + `/files/${room_data.icon_url}`}
                                        onError={(e) => {
                                            e.target.onError = null;
                                            e.target.src = "https://cdn-icons-png.flaticon.com/512/8184/8184182.png";
                                        }}
                                    />

                                    <h2>{room_data.r_name}</h2>
                                </div>

                                <button
                                    className={styles.roomOptions}
                                    onClick={() => navigate(
                                        `/room/dashboard/${room_id}`,
                                        {
                                            state: {
                                                from: `/room/home/${room_id}`
                                            }
                                        }
                                    )}
                                ><i className="fa-solid fa-bars"></i></button>
                            </div>

                            <div className={styles.chatContainer}>
                                {
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
                                                            conseqFiles={messages[index - 1]?.sender_details.sender_id === msg.sender_details.sender_id}
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
                                                        conseq_msgs={messages[index - 1]?.sender_details.sender_id === msg.sender_details.sender_id}
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
                            />

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

                        <div className={styles.roomContents}>
                            <h3>Room Contents</h3>

                            <div className={styles.pinnedMsgs}>
                                <h4>Pinned Messages</h4>

                                <h5>No Pinned Messages</h5>
                            </div>

                            <div className={styles.materials}>
                                <h4>Materials</h4>

                                <h5>No Materials Uploaded</h5>
                            </div>
                        </div>
                    </div>
            }
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