import { useState } from "react";
import { server_url } from '../../../../../configs/server_url';
import Toggle from "../../../../../reusable_component/toggle_button/Toggle";
import styles from "./my_portfolio.module.css";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../../../loading_screen/PageLoader";
import { useEffect } from "react";
import axios from "axios";
import { useContext } from "react";
import { AppContext } from "../../../../../Contexts";
import WriterPopup from "../get_started/GetStarted";

export default function MyPortfolio(props) {
    const { user_details, setLogout } = useContext(AppContext);

    const [{
        username,
        pfp,
        about,
        department,
        money_earned,
        rating,
        assignments_delivered,
        assignments_created,
        price_per_page,
        sample_url,
        available
    }, setDetails] = useState({
        username: "",
        pfp: "#",
        about: "",
        department: "",
        money_earned: 0,
        rating: "_",
        assignments_delivered: 0,
        assignments_created: 0,
        price_per_page: "_",
        sample_url: "#",
        available: true
    });

    const [am_i_this_writer, setIt] = useState(false);
    const [loading, setLoading] = useState(true);
    const [change_trigger, setChangeTrigger] = useState(false);

    useEffect(() => {
        setLoading(true);

        axios.get(
            server_url + `/orders/writer/get?writer_id=${user_details?.id || sessionStorage.getItem("user_id")}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).then(res => {
            const { am_i_this_writer, ...details } = res.data.writer_details;
            setDetails(details);
            setIt(am_i_this_writer);
            setLoading(false);
        }).catch(err => {
            console.log(err);
            setLoading(false);

            if (["INVALID_JWT", "FORBIDDEN"].includes(err.response?.data?.code))
                setLogout();
        });
    }, [change_trigger]);

    const setAvailability = (value) => {
        setDetails(prev => ({ available: value, ...prev }));

        axios.post(
            server_url + `/orders/writer/available?writer_id=${user_details?.id || sessionStorage.getItem("user_id")}`,
            { available: value },
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).then(res => console.log(res.data.success));
    }

    const navigate = useNavigate();

    return (
        <div className={styles.mainDiv}>
            <div className={styles.header}>
                <div>
                    <h2>My Portfolio</h2>
                </div>

                <div>
                    <button>
                        <i
                            className="fa-solid fa-chevron-left"
                            style={{
                                color: "var(--danger)",
                                fontWeight: "900",
                                fontSize: "1.1em"
                            }}
                            onClick={() => navigate("/assignments")}
                        ></i>
                    </button>

                    <button className={styles.utilBtn}><i className="fa-solid fa-cart-shopping"></i></button>

                    <button className={styles.utilBtn}><i className="fa-solid fa-envelope"></i></button>
                </div>
            </div>

            {
                loading
                    ?
                    <PageLoader />
                    :
                    <>
                        <div className={styles.profileInfo}>
                            <div className={styles.pfp}>
                                <img
                                    src={server_url + "/files/" + pfp}
                                    onError={e => {
                                        e.target.onerror = null;
                                        e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                                    }}
                                />
                            </div>

                            <div className={styles.userData}>
                                <h3>{username}</h3>

                                <p>{department}</p>
                            </div>

                            {
                                am_i_this_writer
                                    ?
                                    <div className={styles.availability}>
                                        <h5>Available for work</h5>

                                        <Toggle
                                            defaultValue={available}
                                            onChange={setAvailability}
                                        />
                                    </div>
                                    :
                                    <></>
                            }
                        </div>

                        <div className={styles.stats}>
                            {
                                am_i_this_writer
                                    ?
                                    <div className={`${styles.statCard} ${styles.moneyEarned}`}>
                                        <h5>MONEY EARNED</h5>

                                        <div className={styles.value}>
                                            <i className="fa-solid fa-indian-rupee-sign"></i>

                                            <p>{money_earned}</p>
                                        </div>
                                    </div>
                                    :
                                    <></>
                            }

                            <div className={`${styles.statCard} ${styles.rating}`}>
                                <h5>AVERAGE RATING</h5>

                                <div className={styles.value}>
                                    <p>{rating}</p>

                                    <span>/</span>

                                    <i className={`fa-solid fa-5`}></i>
                                </div>
                            </div>

                            <div className={`${styles.statCard} ${styles.assignmentsWritten}`}>
                                <h5>ASSIGNMENTS DELIVERED</h5>

                                <div className={styles.value}>
                                    <p>{assignments_delivered}</p>
                                </div>
                            </div>

                            {
                                am_i_this_writer
                                    ?
                                    <div className={`${styles.statCard} ${styles.assignmentsCreated}`}>
                                        <h5>ASSIGNMENTS CREATED</h5>

                                        <div className={styles.value}>
                                            <p>{assignments_created}</p>
                                        </div>
                                    </div>
                                    :
                                    <></>
                            }

                            <div className={`${styles.statCard} ${styles.pricePerPage}`}>
                                <h5>PRICE PER PAGE</h5>

                                <div className={styles.value}>
                                    <i className="fa-solid fa-indian-rupee-sign"></i>

                                    <p>{price_per_page}</p>

                                    {
                                        am_i_this_writer
                                            ?
                                            <button
                                                style={{
                                                    backgroundColor: "transparent",
                                                    border: "none"
                                                }}
                                                onClick={() => setChangeTrigger(true)}
                                            ><i
                                                className="fa-solid fa-pencil"
                                                style={{
                                                    color: "var(--accent)",
                                                    fontSize: "0.91em"
                                                }}
                                            >
                                                </i>
                                            </button>
                                            :
                                            <></>
                                    }
                                </div>
                            </div>
                        </div>

                        <hr />

                        <div className={styles.sample}>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    width: "100%",
                                    alignItems: "center",
                                    justifyContent: "space-between"
                                }}
                            >
                                <h3>Handwriting Specimen</h3>

                                {
                                    am_i_this_writer
                                        ?
                                        <button
                                            style={{
                                                backgroundColor: "transparent",
                                                border: "none"
                                            }}
                                            onClick={() => setChangeTrigger(true)}
                                        ><i
                                            className="fa-solid fa-pencil"
                                            style={{
                                                color: "var(--primary)",
                                                fontSize: "0.91em"
                                            }}
                                        >
                                            </i>
                                        </button>
                                        :
                                        <></>
                                }
                            </div>

                            <img
                                src={server_url + "/files/" + sample_url}
                                onError={e => {
                                    e.onerror = null;
                                    e.target.src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQznUqYhO1tPH_lZhYtNtPXO6BF3_6tsJDPSQ&s"
                                }}
                            />
                        </div>

                        <div className={styles.footer}>
                            <div className={styles.footerText}>
                                <h4>Need Help with Assignments?</h4>

                                <p>
                                    Connect with skilled writers, get quality handwritten assignments,
                                    and meet your deadlines without stress.
                                </p>
                            </div>

                            <div className={styles.footerLinks}>
                                <span onClick={() => navigate("/aprilfool")}>Contact Us</span>

                                <i className="fa-regular fa-circle-dot"></i>

                                <span onClick={() => navigate("/aprilfool")}>How It Works</span>

                                <i className="fa-regular fa-circle-dot"></i>

                                <span onClick={() => navigate("/aprilfool")}>Become a Writer</span>

                                <i className="fa-regular fa-circle-dot"></i>

                                <span onClick={() => navigate("/aprilfool")}>Privacy Policy</span>
                            </div>

                            <div className={styles.footerContact}>
                                <p>Have questions or issues?</p>

                                <p>Email us anytime, we're here to help.</p>
                            </div>

                            <div className={styles.footerIcons}>
                                <i className="fa-brands fa-instagram"></i>

                                <i className="fa-brands fa-square-linkedin"></i>

                                <i className="fa-solid fa-envelope"></i>
                            </div>
                        </div>
                    </>
            }

            <WriterPopup
                show={change_trigger}
                setShow={setChangeTrigger}
                condn={"update"}
                price_per_page={price_per_page}
                sample_url={sample_url}
            />
        </div>
    );
}