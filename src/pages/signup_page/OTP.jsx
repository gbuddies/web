import { useEffect, useState, useRef, useContext } from "react";
import styles from "./otpver.module.css";
import axios from "axios";
import { server_url } from '../../configs/server_url.js';
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../Contexts";
import { code_alert_mapper } from "../page_utils/code_alert_mapper";
import { loadUserDetails } from "../../loadUserDetails";
import { UiContext } from "../../utils/UiContext";
import ButtonLoader from "../loading_screen/ButtonLoader";

export default function OTP(props) {
    // Getting required contexts
    const { setUserDetails, setLoading, setLogOut } = useContext(AppContext);
    const { setOverride } = useContext(UiContext);

    // Loaders
    const [resend_loader, setResendLoader] = useState(true);

    // Store countdown time
    const [time_remaining, setTimeRemaining] = useState(300);

    // Resend timer
    const [resend_countdown, setResendCountDown] = useState(0);

    // Store the input values
    const [values, setValues] = useState(Array(6).fill(""));

    // Refs to control input tags
    const input_refs = useRef([]);

    // Verification under process
    const [is_loading, setVerLoading] = useState(false);

    const navigate = useNavigate();
    const { setLogin } = useContext(AppContext);

    // Timer
    useEffect(() => {
        if (time_remaining <= 0)
            return;

        const timer = setTimeout(() => {
            setTimeRemaining(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [time_remaining]);

    // Auto focus 1st input
    useEffect(() => {
        input_refs.current[0]?.focus();
    }, []);

    // Handle OTP changes
    const handleChange = (e, index) => {
        if (time_remaining <= 0) return;

        const value = e.target.value;

        // Allow only digits
        if (!/^\d?$/.test(value)) return;

        const newValues = [...values];
        newValues[index] = value;
        setValues(newValues);

        // Auto focus next
        if (value && index < 5) {
            input_refs.current[index + 1].focus();
        }
    };

    // For UX
    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            if (!values[index] && index > 0) {
                input_refs.current[index - 1].focus();
            }
        }

        if (e.key === "ArrowLeft" && index > 0) {
            input_refs.current[index - 1].focus();
        }

        if (e.key === "ArrowRight" && index < 5) {
            input_refs.current[index + 1].focus();
        }
    };

    // Paste => fill all the inputs
    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").slice(0, 6);

        if (!/^\d+$/.test(pasted)) return;

        const newValues = pasted.split("").slice(0, 6);
        setValues([
            ...newValues,
            ...Array(6 - newValues.length).fill("")
        ]);

        const focusIndex = Math.min(newValues.length - 1, 5);
        input_refs.current[focusIndex]?.focus();
    };

    // Verify entered OTP
    const handleVerifyClick = async () => {
        const final_otp = values.join("");
        setVerLoading(true);

        try {
            const result = await axios.post(
                `${server_url}/auth/verify-otp?user_id=${localStorage.getItem("user_id")}`,
                {
                    email: props.email,
                    otp: final_otp
                },
                {
                    headers: {
                        auth_token: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            )

            if (result.data.success) {
                setLogin();
                navigate("/dashboard");
                await loadUserDetails(setUserDetails, setLoading, setOverride, setLogOut);
            }
        }
        catch (err) {
            props.setAlert(code_alert_mapper[err.response?.data?.code]);
        }
        finally{
            setVerLoading(false);
        }
    };

    const sendOTP = () => {
        setResendLoader(true);

        axios.post(
            `${server_url}/auth/send-otp?user_id=${localStorage.getItem("user_id")}`,
            {
                email: props.email
            },
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).then(res => {
            if (res.data.success) {
                setTimeRemaining(300);
                setResendCountDown(60);
            }
            else
                props.setAlert(code_alert_mapper[res.data?.code]);

            setResendLoader(false);
        }).catch(err => {
            props.setAlert(code_alert_mapper[err.response?.data?.code]);
            console.log(err);
            setResendLoader(false);
        })
    }

    useEffect(() => {
        if (resend_countdown === 0) {
            return;
        }

        const resendTimer = setTimeout(() => {
            setResendCountDown(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(resendTimer);
    }, [resend_countdown]);

    useEffect(() => {
        sendOTP();
    }, []);

    return (
        <div className={styles.otpScreen}>
            <div className={styles.emailDiv}>
                <p className={styles.subtitle}>
                    OTP was sent to <span className={styles.email}>{props.email || "your email"}</span>
                </p>
            </div>

            <div
                className={styles.inputsContainer}
                onPaste={handlePaste}
            >
                {
                    values.map((val, index) => (
                        <input
                            key={index}
                            type="text"
                            inputMode="numeric"
                            maxLength="1"
                            className={styles.otpInput}
                            value={val}
                            ref={(el) => (input_refs.current[index] = el)}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            disabled={time_remaining <= 0}
                        />
                    ))
                }
            </div>

            <div className={styles.timer}>
                {time_remaining > 0 ? (
                    <h5>
                        Time remaining: <span>{time_remaining} sec</span>
                    </h5>
                ) : (
                    <h5 className={styles.expired}>OTP Expired</h5>
                )}
            </div>

            <button
                className={styles.verifyBtn}
                onClick={handleVerifyClick}
                disabled={
                    is_loading ||
                    time_remaining <= 0 ||
                    values.includes("")
                }
            >
                {
                    is_loading
                        ? <ButtonLoader
                            loader_style={{
                                gap: "4px"
                            }}
                            dot_style={{
                                backgroundColor: "var(--text-secondary)"
                            }}
                            />
                        : "Verify"
                }
            </button>

            <div className={styles.resendInfo}>
                {
                    (resend_countdown === 0)
                        ? <button
                            className={resend_loader ? styles.loader : ""}
                            onClick={sendOTP}
                        >
                            {
                                resend_loader
                                    ? <ButtonLoader
                                        loader_style={{
                                            gap: "1px"
                                        }}
                                        dot_style={{
                                            width: "6px",
                                            height: "6px"
                                        }}
                                    />
                                    : "Resend OTP"
                            }
                        </button>
                        : <p>Resend OTP available in <span>{resend_countdown} sec</span></p>
                }
            </div>
        </div>
    );
}