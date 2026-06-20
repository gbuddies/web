import { useNavigate } from "react-router-dom";
import { server_url } from '../../../../configs/server_url';
import eposhToString from "../../../../reusable_component/util_funcs/EpochToReadable";
import styles from "./gc_preview.module.css";

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

export default function GCPreview(props) {
    const navigate = useNavigate();

    return (
        <div className={styles.gcDiv}>
            <header>
                <div>
                    <i
                        style={{
                            color: "var(--accent)",
                            padding: "8px",
                            border: "1px solid var(--border-light)",
                            borderRadius: "50%",
                            width: "16px",
                            height: "16px",
                            fontSize: "16px"
                        }}
                        className="fa-solid fa-earth-asia"
                    ></i>
                    <h3>Global Chat</h3>
                </div>

                <button
                    onClick={() => navigate("/globalchat")}
                >  
                    <span>Open Chat</span>
                    <i className="fa-solid fa-arrow-right-long"></i>
                </button>
            </header>

            <div className={styles.body}>
                <MessageCard
                    url={"#"}
                    name={"Placeholder1"}
                    timestamp={Date.now()}
                    message={"hahaha ha ahha habhbja hhH"}
                />

                <MessageCard
                    url={"#"}
                    name={"Placeholder2"}
                    timestamp={Date.now()}
                    message={"hahaha ha ahha habhbja hhHdhdh iushf ub hsvvyu"}
                />
            </div>
        </div>
    );
}

function MessageCard(props) {

    return (
        <div className={styles.msgCard}>
            <img
                src={server_url + "/files/" + props.url}
                onError={e => {
                    e.onerror = null;
                    e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                }}
            />

            <div>
                <div>
                    <h5
                        style={{
                            fontSize: "0.8em",
                            color: "var(--text-primary)",
                            opacity: "0.8"
                        }}
                    >{props.name}</h5>
                    <span
                        style={{
                            fontSize: "0.64em",
                            color: "var(--text-secondary)",
                            opacity: "0.8"
                        }}
                    >{formatTime(props.timestamp)}, {eposhToString(props.timestamp)}</span>
                </div>

                <p>{props.message}</p>
            </div>
        </div>
    );
}