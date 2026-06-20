import { useContext, useEffect, useState, useRef, useLayoutEffect } from 'react';
import axios from "axios";
import { File, Message, DateStamp } from "../../../reusable_component/message_dev/Message";
import EmojiBox from "../../../reusable_component/emoji_box/EmojiBox";
import MessageBar from '../../../reusable_component/message_bar/MessageBar';
import SideBar from '../../../reusable_component/SideBar';
import styles from './globalchat.module.css';
import { AppContext } from '../../../Contexts';
import { server_url } from '../../../configs/server_url';
import { UiContext } from '../../../utils/UiContext';
import FileObject from '../../../reusable_component/file_object/FileObject';
import PageLoader from '../../loading_screen/PageLoader';
import eposhToString from '../../../reusable_component/util_funcs/EpochToReadable';
import { useNavigate } from 'react-router-dom';

export default function GlobalChat() {
    const { user_details, socket, setLogOut } = useContext(AppContext);

    const { setOverride } = useContext(UiContext);

    useEffect(() => {
        if (socket === null) {
            setOverride("loading");
        }
        else {
            setOverride(null);
        }
    }, [socket]);

    const input_ref = useRef(null);
    const bottomRef = useRef(null);
    const emojiWrapperRef = useRef(null);
    const hasMounted = useRef(false);
    const prevMsgCount = useRef(0);
    const chatRef = useRef(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const emojiRef = useRef(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);
    const [is_loading, setLoading] = useState(true);

    const [offset, setLastSeenId] = useState(Number.MAX_SAFE_INTEGER);

    // File Picker:
    const [show_file_object, setShowFileObject] = useState(false);
    const [files, setFiles] = useState([]);

    // File input handler:
    const handleFiles = (e) => {
        setFiles(Array.from(e.target.files));
        setShowFileObject(true);
        input_ref?.current?.focus();
    }

    /* ---------------- INITIAL LOAD (jump to bottom instantly) ---------------- */
    useLayoutEffect(() => {
        if (!bottomRef.current || hasMounted.current || messages.length === 0) return;

        bottomRef.current.scrollIntoView({ behavior: "auto" });
        hasMounted.current = true;
        prevMsgCount.current = messages.length;
    }, [messages]);

    /* ---------------- HANDLE NEW MESSAGES ---------------- */
    useEffect(() => {
        if (!hasMounted.current) return;

        const newMessageArrived = messages.length > prevMsgCount.current;

        if (newMessageArrived) {
            if (autoScroll) {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                setShowNewMsgBtn(false);
            } else {
                setShowNewMsgBtn(true);
            }
        }

        prevMsgCount.current = messages.length;
    }, [messages, autoScroll]);

    /* ---------------- SOCKET RECEIVE ---------------- */
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (res) => {
            if (user_details?.id === Number(res.sender_details.sender_id)) return;

            setMessages(
                prev => [...prev, res]
            );
        };

        socket.on("receive_message", handleMessage);

        return () => socket.off("receive_message", handleMessage);
    }, [socket, user_details?.id]);

    /* ---------------- FETCH OLD MESSAGES ---------------- */
    useEffect(() => {
        const token = localStorage.getItem("token");
        setLoading(true);

        axios.get(`${server_url}/messages/global?offset=${offset}`, {
            headers: {
                auth_token: `Bearer ${token}`
            }
        })
            .then(res => {
                setMessages(res.data.chats);
                setLastSeenId(res.data.chats[messages.length - 1]?.identifier?.message_id || 0);
                setLoading(false);
            })
            .catch(err => {
                console.log(err);

                if (err.response?.data?.code === "INVALID_JWT")
                    setLogOut();

                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                emojiWrapperRef.current &&
                !emojiWrapperRef.current.contains(event.target)
            ) {
                setShowEmoji(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    /* ---------------- SEND MESSAGE ---------------- */
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
                message_id: null
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
        setShowEmoji(false);

        const form = new FormData();

        files.forEach(file => form.append("files", file));
        let files_list = [];

        setFiles([]);
        setShowFileObject(false);

        document.getElementById("file").value = "";

        try {
            const res = await axios.post(
                `${server_url}/files/upload?user_id=${user_details?.id || localStorage.getItem("user_id")}`,
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
            identifiers: {},
            sender_details: {
                sender_id: user_details?.id || localStorage.getItem("user_id"),
                sender_name: user_details?.username,
                sender_pfp: user_details?.pfp
            },
            text: local_message.text,
            files_list
        };

        socket.emit("send_message", { message_form });

        input_ref.current.focus();
        input_ref.current.style.height = "auto";
    };

    useEffect(() => {
        if (!socket)
            return;

        const handleFailedMessages = (res) => {
            setMessages(prev =>
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
            );
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
        socket.on("message_emit-success", updateMsgs);

        return () => {
            socket.off("socket_error", handleFailedMessages);
            socket.off("message_emit-success", updateMsgs);
        }
    }, [socket]);

    const handleEmojiSelect = (emojiData, event) => {
        event.stopPropagation();

        const input = input_ref.current;
        if (!input) return;

        const start = input.selectionStart;
        const end = input.selectionEnd;

        const newMessage =
            message.substring(0, start) +
            emojiData.emoji +
            message.substring(end);

        setMessage(newMessage);

        setTimeout(() => {
            input.focus();
            input.selectionStart = input.selectionEnd =
                start + emojiData.emoji.length;
        }, 0);
    };

    const navigate = useNavigate();

    return (
        <div className={styles.dashboardMain}>
            <SideBar active_page="dashboard" location="/dashboard" />

            <div className={styles.body}>
                <div className={styles.header}>
                    <button
                        style={{
                            backgroundColor: "transparent",
                            border: "none"
                        }}
                        onClick={() => navigate("/dashboard")}
                    ><i
                        style={{
                            color: "var(--danger)",
                            fontSize: "1.06em"
                        }}
                        className="fa-solid fa-chevron-left"
                    ></i></button>

                    <div>
                        <h2 className={styles.global}>Global Chat</h2>
                        <h5 className={styles.smallName}>College Wide Discussions</h5>
                    </div>
                </div>

                <div
                    ref={chatRef}
                    onScroll={() => {
                        const el = chatRef.current;
                        const isNearBottom =
                            el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                        setAutoScroll(isNearBottom);
                    }}
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "12px"
                    }}
                    className={styles.chatspace}
                >
                    {
                        is_loading
                            ?
                            <PageLoader />
                            :
                            <>
                                {messages.length ? <div style={{ height: "56px" }}></div> : <></>}

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
                                                            key={`${msg.msg_id || msg.identifiers.message_id}-${file_index}`}
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
                                                        key={`${msg.msg_id || msg.identifiers.message_id}-message`}
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
                                        <div
                                            className={styles.noMsgs}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        ><h5>No Recent Messages</h5></div>
                                }

                                {messages.length ? <div style={{ height: "56px" }}></div> : <></>}

                                <div ref={bottomRef} />
                            </>
                    }
                </div>

                {/* NEW MESSAGE BUTTON */}
                {showNewMsgBtn && (
                    <button
                        onClick={() => {
                            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                            setAutoScroll(true);
                            setShowNewMsgBtn(false);
                        }}
                        style={{
                            position: "fixed",
                            bottom: "90px",
                            right: "40px",
                            padding: "10px 14px",
                            borderRadius: "20px",
                            backgroundColor: "var(--accent)",
                            color: "var(--text-primary)",
                            border: "none",
                            cursor: "pointer",
                            zIndex: 1000
                        }}
                    >
                        <i
                            className="fa-solid fa-chevron-down"
                            style={{
                                color: "var(--text-primary)"
                            }}
                        ></i> New messages
                    </button>
                )}

                {
                    show_file_object
                    &&
                    <FileObject
                        files={files}
                    />
                }

                <MessageBar
                    setShowPicker={setShowEmoji}
                    handleFiles={handleFiles}
                    input_ref={input_ref}
                    message={message}
                    setMessage={setMessage}
                    sendMessage={sendMessage}
                />

                {
                    showEmoji && (
                        <div ref={emojiRef} className={styles.emojiBox} >
                            <EmojiBox
                                setEmoji={handleEmojiSelect}
                            />
                        </div>
                    )
                }

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