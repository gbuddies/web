import styles from "./message.module.css";
import { server_url } from '../../configs/server_url.js';
import { getIcon } from "../file_object/FileObject";
import { useRef, useState } from "react";

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

const isSingleEmoji = (text) => {
    if (!text) return false;

    const trimmed = text.trim();
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    const segments = [...segmenter.segment(trimmed)];

    if (segments.length !== 1) return false;

    return /\p{Extended_Pictographic}/u.test(trimmed);
};

export function Message(props) {

    return (
        <div className={styles.messageDiv}>
            {
                Number(sessionStorage.getItem("user_id")) != props.sender_id
                    ?
                    <div className={`${(
                        props.conseq_msgs
                    ) && styles.conseqMsg} ${styles.senderMsg}`}>
                        {
                            props.constraint !== "no-logo"
                            &&
                            <img
                                src={server_url + `/files/${props.sender_pfp}`}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                                }}
                            />
                        }

                        <div className={styles.wrapper}>
                            {
                                (!props.conseq_msgs && props.constraint !== "no-logo")
                                &&
                                <h5 style={{ marginTop: "8px" }}>{props.sender_name}</h5>
                            }

                            <div className={`${styles.message}`}>
                                {
                                    isSingleEmoji(props.message)
                                        ? <h1>{props.message}</h1>
                                        : <p
                                            style={{
                                                fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                                            }}
                                        >{props.message}</p>
                                }

                                <div className={styles.time}>
                                    <p>{formatTime(props.timestamp)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    :
                    <div className={`${(props.conseq_msgs && sessionStorage.getItem("user_id") != props.sender_id) && styles.conseqMsg} ${styles.myMsg}`}>
                        <div className={`${styles.message}`}>
                            {
                                isSingleEmoji(props.message)
                                    ? <h1>{props.message}</h1>
                                    : <p
                                        style={{
                                            fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                                        }}
                                    >{props.message}</p>
                            }

                            <div className={styles.time}>
                                {
                                    props.status === "pending"
                                        ?
                                        <i className={`${"fa-regular fa-clock"} ${styles.messageLoader}`}></i>
                                        :
                                        (
                                            props.status === "failed"
                                                ?
                                                <i
                                                    className="fa-regular fa-circle-xmark"
                                                    style={{
                                                        fontSize: "0.75em",
                                                        color: "var(--danger-light)"
                                                    }}
                                                ></i>

                                                :
                                                <p>{formatTime(props.timestamp)}</p>
                                        )
                                }
                            </div>
                        </div>

                        {
                            (props.constraint !== "no-logo" && sessionStorage.getItem("user_id") != props.sender_id)
                            &&
                            <img
                                src={server_url + `/files/${props.sender_pfp}`}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                                }}
                            />
                        }
                    </div>
            }
        </div>
    );
}

export function File(props) {
    const [url, setURL] = useState("#");
    const download_ref = useRef(null);

    const handleDownload = () => {
        const link = download_ref.current;
        link.href = server_url + "/files/" + props.file_url;
        link.click();
    };

    return (
        <div className={styles.fileDiv}>
            <a
                href={url}
                ref={download_ref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "none" }}
            ></a>

            {
                Number(sessionStorage.getItem("user_id")) != props.sender_id
                    ?
                    <div
                        className={`${(
                            props.conseq_msgs
                        ) ? styles.conseqFile : ""} ${styles.senderFile}`}
                    >
                        {
                            props.constraint !== "no-logo"
                            &&
                            <img
                                src={server_url + `/files/${props.sender_pfp}`}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                                }}
                            />
                        }

                        <div className={styles.wrapper}>
                            {
                                (!props.conseqFile && props.constraint !== "no-logo")
                                &&
                                <h5>{props.sender_name}</h5>
                            }

                            <div className={styles.file}>
                                <div className={`${styles.fileInfo}`} onClick={handleDownload}>
                                    <div className={`${styles.icon} ${getIcon(props.filename).classname}`}>
                                        {getIcon(props.filename).element}
                                    </div>

                                    <h3>{props.filename}</h3>
                                </div>

                                <div className={styles.time}>
                                    <p>{formatTime(props.timestamp)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    :
                    <div className={`${(props.conseq_msgs && sessionStorage.getItem("user_id") != props.sender_id) && styles.conseqFile} ${styles.myFile}`}>
                        <div className={styles.file}>
                            <div className={`${styles.fileInfo}`} onClick={handleDownload}>
                                <div className={`${styles.icon} ${getIcon(props.filename).classname}`}>
                                    {getIcon(props.filename).element}
                                </div>

                                <h3>{props.filename}</h3>
                            </div>

                            <div className={styles.time}>
                                {
                                    props.status === "pending"
                                        ?
                                        <i className={`${"fa-regular fa-clock"} ${styles.messageLoader}`}></i>
                                        :
                                        (
                                            props.status === "failed"
                                                ?
                                                <i
                                                    className="fa-regular fa-circle-xmark"
                                                    style={{
                                                        fontSize: "0.75em",
                                                        color: "var(--danger-light)"
                                                    }}
                                                ></i>

                                                :
                                                <p>{formatTime(props.timestamp)}</p>
                                        )
                                }
                            </div>
                        </div>

                        {
                            (props.constraint !== "no-logo" && sessionStorage.getItem("user_id") != props.sender_id)
                            &&
                            <img
                                src={server_url + `/files/${props.sender_pfp}`}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                                }}
                            />
                        }
                    </div>
            }
        </div>
    );
}

export function DateStamp({ day }) {

    return (
        <div
            className={styles.dayStamp}
            style={{
                width: "calc(100% - 16px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px"
            }}
        >
            <p
                style={{
                    backgroundColor: "transparent",
                    color: "var(--text-secondary)",
                    padding: "8px",
                    fontWeight: "500",
                    letterSpacing: "0.8px",
                    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    borderRadius: "8px"
                }}
            >{day}</p>
        </div>
    );
}