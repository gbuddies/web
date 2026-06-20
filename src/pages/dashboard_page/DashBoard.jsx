import { useState } from "react";
import SideBar from "../../reusable_component/SideBar";
import styles from "./dashboard.module.css";
import { useContext } from "react";
import { AppContext } from "../../Contexts";
import GCPreview from "./components/GC_preview/GCPreview";
import AssignmentsCard from "./components/assignments_div/AssignmentsCard";

export default function DashBoard(props) {
    const { user_details } = useContext(AppContext);
    const [new_notifs, setNewNotifs] = useState(false);

    return (
        <div className={styles.dashboard}>
            <SideBar active_page="dashboard" location="/dashboard" />

            <div className={styles.mainDiv}>
                <header>
                    <h2 style={{ color: "var(--primary)" }}>G-Buddies</h2>

                    <div className={styles.utils}>
                        <button>
                            <i className="fa-solid fa-bell"></i>
                            <span>Notifications</span>
                        </button>

                        <button>
                            <i className="fa-solid fa-circle-question"></i>
                            <span>About</span>
                        </button>

                        <button>
                            <i className="fa-solid fa-handshake-angle"></i>
                            <span>Support</span>
                        </button>
                    </div>
                </header>

                <div className={styles.hero}>
                    <h1>
                        Hello, {user_details?.username}
                        
                        <i
                            style={{
                                color: "var(--warning)"
                            }}
                            className="fa-solid fa-face-laugh-beam"
                        ></i>
                    </h1>

                    <div className={styles.highlights}>
                        {/*  */}
                    </div>
                </div>

                <div className={styles.body}>
                    <div className={styles.cta}>
                        <GCPreview />

                        <AssignmentsCard />
                    </div>

                    <div className={styles.functionalities}>
                        <div className={styles.quickActions}>
                            <h3>Quick Actions</h3>

                            <div>
                                <div className={styles.createRoom}>
                                    <i
                                        style={{
                                            color: "var(--success)",
                                            backgroundColor: "var(--success-bg)"
                                        }}
                                        className="fa-solid fa-plus"
                                    ></i>

                                    <h5><span>Create</span> Room</h5>
                                </div>

                                <div className={styles.startChat}>
                                    <i
                                        style={{
                                            color: "var(--primary)",
                                            backgroundColor: "var(--primary-bg)"
                                        }}
                                        className="fa-regular fa-message"
                                    ></i>

                                    <h5><span>Start</span> Chat</h5>
                                </div>

                                <div className={styles.addFrnd}>
                                    <i
                                        style={{
                                            color: "var(--warning)",
                                            backgroundColor: "var(--warning-bg)"
                                        }}
                                        className="fa-solid fa-user-plus"
                                    ></i>

                                    <h5><span>Add</span> Friend</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}