import styles from "./user_settings.module.css";

import { useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../Contexts";
import { loadUserDetails } from "../../loadUserDetails.js";
import axios from "axios";
import { server_url } from '../../configs/server_url.js';
import { UiContext } from "../../utils/UiContext";

export default function UserSettings() {
    const location = useLocation();
    const navigate = useNavigate();
    const {user_details} = useContext(AppContext);

    const {setUserDetails, setLoading, setLogOut} = useContext(AppContext);
    const {setOverride} = useContext(UiContext);

    const from = location.state?.from || "/dashboard";

    const [user_pfp, setPfp] = useState("");
    const [user_name, setUsername] = useState("");
    const [department, setDepartment] = useState("");
    const [about, setAbout] = useState("");
    const [phone_no, setPhnNo] = useState("");
    const [email, setEmail] = useState("");

    const [save_status, setSaveStatus] = useState(false);

    useEffect(() => {

        if (!user_details.id) return;

        setPfp(user_details.pfp || "");
        document.getElementById("pfp").src = server_url + "/files/" + user_details.pfp;
        setUsername(user_details.username || "");
        setDepartment(user_details.department || "");
        setAbout(user_details.about || "");
        setPhnNo(user_details.phone || "");
        setEmail(user_details.personal_email || "");
    }, [user_details])

    const openFileSelector = () => document.getElementById("logo").click();

    const handlePfp = (e) => {
        setPfp(e.target.files[0]);
        const img_url = URL.createObjectURL(e.target.files[0]);
        document.getElementById("pfp").src = img_url;
    }

    const saveChanges = async () => {
        setSaveStatus(true);
        const form = new FormData();

        form.append("pfp", user_pfp);
        form.append("username", user_name);
        form.append("department", department);
        form.append("about", about);
        form.append("phone", phone_no);
        form.append("email", email);

        try{
            const token = localStorage.getItem("token");
            
            const res = await axios.post(
                `${server_url}/users/save-details?user_id=${user_details?.id || localStorage.getItem("user_id")}`,
                form,
                {
                    headers: {
                        auth_token: `Bearer ${token}`
                    }
                }
            );

            if (res.data.success)
                await loadUserDetails(setUserDetails, setLoading, setOverride, setLogOut);
        }
        catch (err){
            console.log(err);

            if (
                err.response.data.code === "INVALID_JWT" ||
                err.response.data.code === "MISSING_DATA"
            ) setLogOut();
        }

        setSaveStatus(false);
        navigate(from);
    }

    return (
        <div className={styles.generalScreen}>
            <div className={styles.header}>
                <h1>Account Settings</h1>

                <button
                    className={styles.backBtn}
                    onClick={() => navigate(from)}
                >
                    <i className="fa-solid fa-chevron-left"></i>
                    <span> Back</span>
                </button>
            </div>

            <div className={styles.infoWrapper}>
                <div className={styles.hospitalInfo}>
                    <h3>Personal Information</h3>

                    <div className={styles.logoContainer}>
                        <div className={styles.logoDiv}>
                            <img
                                id="pfp"
                                src={server_url + "/files/" + user_details.pfp}
                                onError={e => {
                                    e.target.onerror = null;
                                    e.target.src = "https://www.shutterstock.com/image-vector/blank-image-photo-placeholder-icon-600nw-2501054919.jpg"
                                }}
                            />
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            id="logo"
                            hidden
                            onChange={handlePfp}
                        />

                        <button
                            className={styles.whenWide}
                            onClick={openFileSelector}
                        >
                            <i className="fa-regular fa-image"></i> Upload Image
                        </button>

                        <button
                            className={styles.whenNarrow}
                            onClick={openFileSelector}
                        >
                            <i className="fa-regular fa-image"></i> Upload
                        </button>
                    </div>

                    <div className={styles.nameSec}>
                        <h5>User Name</h5>
                        <input
                            type="text"
                            value={user_name}
                            placeholder="Enter your name"
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>

                    <div className={styles.departmentSec}>
                        <h5>Department</h5>
                        <input
                            type="text"
                            value={department}
                            placeholder="Enter your Department"
                            onChange={e => setDepartment(e.target.value)}
                            maxLength="40"
                        />
                    </div>

                    <div className={styles.descriptionSec}>
                        <h5>About</h5>
                        <textarea
                            rows={6}
                            value={about}
                            placeholder="Tell us something about yourself..."
                            onChange={e => setAbout(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.contactInfo}>
                    <h3>Contact Details</h3>

                    <div className={styles.phno}>
                        <h5>Phone Number</h5>
                        <input
                            type="tel"
                            value={phone_no}
                            placeholder="Phone number"
                            onChange={e => setPhnNo(e.target.value)}
                        />
                    </div>

                    <div className={styles.email}>
                        <h5>Personal Email Address</h5>
                        <input
                            type="email"
                            value={email}
                            placeholder="Personal email address"
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div className={styles.visibility}>
                        <h5>Profile Visibility</h5>

                        <div className={styles.everyone}>
                            <label htmlFor="everyone"><h5>Everyone</h5></label>
                            <input type="radio" name="visibility" id="everyone" defaultChecked />
                        </div>

                        <div className={styles.frnds}>
                            <label htmlFor="frnds"><h5>Friends</h5></label>
                            <input type="radio" name="visibility" id="frnds" />
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <button
                    className={styles.cancel}
                    onClick={() => navigate(from)}
                >
                    Cancel
                </button>

                <button
                    className={`${styles.save} utilBtn`}
                    onClick={saveChanges}
                    disabled={save_status}
                >
                    {save_status ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}