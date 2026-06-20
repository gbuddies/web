import { useContext, useState } from 'react';
import styles from './sidebar.module.css'

import { useNavigate } from 'react-router-dom';
import { AppContext } from '../Contexts';
import { server_url } from '../configs/server_url';

export default function SideBar(props) {
    const navigate = useNavigate();
    const { user_details, setLogOut } = useContext(AppContext);

    const [open_left, setOpenLeft] = useState(false);

    return (
        <>
            {
                open_left 
                && 
                <div 
                    className={styles.backDrop}
                    onClick={() => setOpenLeft(prev => !prev)}
                ></div>
            }

            <div className={`${styles.sidebarAtLeft} ${open_left && styles.sidebarOpenedLeft}`}>
                <div className={styles.userProfile} onClick={() => navigate("/user-settings", { state: { from: props.location } })}>
                    <div className={styles.logo}>
                        <img
                            src={server_url + "/files/" + user_details.pfp}
                            onError={e => {
                                e.target.onerror = null;
                                e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                            }}
                        />
                    </div>

                    <div className={styles.userDetails}>
                        <h4>{user_details.username || "User"}</h4>

                        <p>{"Edit your profile"}</p>
                    </div>
                </div>

                <div className={styles.sidebarOptions}>
                    <button
                        className={styles.openSidebar}
                    ><i className="fa-solid fa-expand"></i></button>

                    <button
                        className={`
                            ${props.active_page == "dashboard" && styles.activeBtn}
                        `}
                        onClick={() => {
                            navigate("/dashboard");
                            setOpenLeft(false);
                        }}
                    ><i className="fa-solid fa-table-columns"></i> <span>Dashboard</span></button>

                    <button
                        className={`
                            ${props.active_page == "dms" && styles.activeBtn}
                        `}
                        onClick={() => {
                            navigate("/direct-messages");
                            setOpenLeft(false);
                        }}
                    ><i className="fa-solid fa-message"></i> <span>Messages</span></button>

                    <button
                        className={`
                            ${props.active_page == "privaterooms" && styles.activeBtn}
                        `}
                        onClick={() => {
                            navigate("/rooms");
                            setOpenLeft(false);
                        }}
                    ><i className="fa-solid fa-people-roof"></i> <span>Rooms</span></button>

                    <button
                        className={`
                            ${props.active_page == "friends" && styles.activeBtn}
                        `}
                        onClick={() => {
                            navigate("/friends");
                            setOpenLeft(false);
                        }}
                    ><i className="fa-solid fa-user-group"></i> <span>Friends</span></button>
                </div>

                <div className={styles.sidebarUtils}>
                    <button
                        className={styles.settings}
                        onClick={() => {
                            navigate("/settings", { state: { from: props.location } });
                            setOpenLeft(false);
                        }}
                    ><i className="fa-solid fa-gear"></i> <span>Settings</span></button>

                    <button
                        className={styles.logout}
                        onClick={() => setLogOut()}
                    ><i className="fa-solid fa-arrow-right-from-bracket"></i> <span>Log Out</span></button>
                </div>
            </div>

            <div className={styles.sidebarAtLeftMin}>
                <div
                    className={styles.userProfile}
                    onClick={() => navigate("/user-settings", { state: { from: props.location } })}
                >
                    <div className={styles.logo}>
                        <img
                            src={server_url + "/files/" + user_details.pfp}
                            onError={e => {
                                e.target.onerror = null;
                                e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                            }}
                        />
                    </div>
                </div>

                <div className={styles.sidebarOptions}>
                    <button
                        className={styles.openSidebar}
                        onClick={() => setOpenLeft(prev => !prev)}
                    ><i className="fa-solid fa-expand"></i></button>

                    <button
                        className={`
                            ${props.active_page == "dashboard" && styles.activeBtn}
                        `}
                        onClick={() => navigate("/dashboard")}
                    ><i className="fa-solid fa-table-columns"></i></button>

                    <button
                        className={`
                            ${props.active_page == "dms" && styles.activeBtn}
                        `}
                        onClick={() => navigate("/direct-messages")}
                    ><i className="fa-solid fa-message"></i></button>

                    <button
                        className={`
                            ${props.active_page == "privaterooms" && styles.activeBtn}
                        `}
                        onClick={() => navigate("/rooms")}
                    ><i className="fa-solid fa-people-roof"></i></button>

                    <button
                        className={`
                            ${props.active_page == "friends" && styles.activeBtn}
                        `}
                        onClick={() => navigate("/friends")}
                    ><i className="fa-solid fa-user-group"></i></button>

                    <button
                        className={`
                            ${props.active_page == "assignments" && styles.activeBtn}
                        `}
                        onClick={() => navigate("/assignments")}
                    ><i className="fa-solid fa-file-pen"></i></button>
                </div>

                <div className={styles.sidebarUtils}>
                    <button
                        className={styles.settings}
                        onClick={() => navigate("/settings", { state: { from: props.location } })}
                    ><i className="fa-solid fa-gear"></i></button>

                    <button
                        className={styles.logout}
                        onClick={() => setLogOut()}
                    ><i className="fa-solid fa-arrow-right-from-bracket"></i></button>
                </div>
            </div>

            <div className={styles.sidebarAtTop}>
                <div className={styles.userProfile} onClick={() => navigate("/user-settings", { state: { from: props.location } })}>
                    <div className={styles.logo}>
                        <img
                            src={server_url + "/files/" + user_details.pfp}
                            onError={e => {
                                e.target.onError = null;
                                e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                            }}
                        />
                    </div>

                    <div className={styles.userDetails}>
                        <h4>{user_details.username || "User"}</h4>

                        <p>{user_details.department || "Edit your profile"}</p>
                    </div>
                </div>

                <div className={styles.sidebarUtils}>
                    <button
                        className={styles.utilsBtn}
                        onClick={() => setOpenLeft(prev => !prev)}
                    ><i className="fa-solid fa-bars"></i></button>

                    <button
                        className={styles.settings}
                        onClick={() => navigate("/settings", { state: { from: props.location } })}
                    ><i className="fa-solid fa-gear"></i></button>

                    <button
                        className={styles.logout}
                        onClick={() => setLogOut()}
                    ><i className="fa-solid fa-arrow-right-from-bracket"></i></button>
                </div>
            </div>
        </>
    )
}