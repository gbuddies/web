
// import Logo from '../reusable_elements/Logo'
import styles from './signin_page.module.css';
import { checkValidity } from '../page_utils/AuthPageUtils';
import { AppContext } from '../../Contexts.jsx';
import { loadUserDetails } from '../../loadUserDetails.js';
import { UiContext } from '../../utils/UiContext';
import { code_alert_mapper } from '../page_utils/code_alert_mapper.js';
import Alert from '../../reusable_component/alert_div/Alert.jsx';
import ButtonLoader from '../loading_screen/ButtonLoader.jsx';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { server_url } from '../../../creds/server_url';

function SignInPage() {
    const navigate = useNavigate();
    const { setLogin, setUserDetails, setLoading, setLogOut } = useContext(AppContext);
    const { setOverride } = useContext(UiContext);
    const [alert, setAlert] = useState(false);
    const [load_status, setSignin] = useState(false);

    const [inputs, setInputs] = useState({
        email: '',
        password: ''
    })

    const [input_err_status, seterr] = useState({
        email: false,
        password: false
    });

    const handleInput = (e) => {
        setInputs({
            ...inputs,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!checkValidity({ form: inputs, setInpErrStatus: seterr })) {
            setAlert("All the fields are required!");

            return;
        }

        setAlert(false);
        setSignin(true);

        try {
            const response = await axios.post(`${server_url}/g-chat/auth/signin`, inputs);

            if (response.data.success) {
                sessionStorage.setItem("user_id", response.data.user.id);
                localStorage.setItem("token", response.data.token);

                await loadUserDetails(setUserDetails, setLoading, setOverride, setLogOut);

                setLogin(true);
                navigate("/dashboard");
            } else
                setAlert(code_alert_mapper[response.data.code] || "Something went wrong!");
        } catch (err) {
            console.log("Error:", err);
            setAlert(code_alert_mapper[err.response?.data?.code] || "Something went wrong!");
        }

        setSignin(false);
    }

    const [is_leaving, setIsLeaving] = useState(false);

    const handleTransition = (e) => {
        e.preventDefault();
        setIsLeaving(true);

        setTimeout(() => {
            navigate("/signup");
        }, 300);
    }

    return (
        <div className={styles.signinBody}>
            <div className={`${styles.headerTexts} ${is_leaving ? styles.evaporate : styles.condensate}`}>
                <div className="logo">
                    <h1 className={styles.title}>Welcome Back!</h1>
                </div>

                <p>Login to your G-Buddies account</p>
            </div>

            <div className={`${styles.signinCard} ${is_leaving ? styles.evaporate : styles.condensate}`}>
                <div className={styles.email}>
                    <h5>GITAM Email</h5>

                    <input className={styles.text}
                        type="email"
                        placeholder='Enter your GITAM email address'
                        name='email'
                        value={inputs.email}
                        onChange={handleInput}
                        onKeyDown={e => {
                            e.key === "Enter" && handleSubmit(e)
                        }}

                        style={{ outline: input_err_status.email ? '1px solid red' : 'none' }}
                    />
                </div>

                <div className={styles.pswd}>
                    <h5>Password</h5>

                    <input className={styles.text}
                        type="password"
                        placeholder='Enter your password'
                        name='password'
                        value={inputs.password}
                        onChange={handleInput}
                        onKeyDown={e => {
                            e.key === "Enter" && handleSubmit(e)
                        }}

                        style={{ outline: input_err_status.password ? '1px solid red' : 'none' }}
                    />
                </div>

                <div className={styles.utils}>
                    <div className={styles.rememberMeDude}>
                        <label>
                            <input type="checkbox" />

                            <h5>Remember me</h5>
                        </label>
                    </div>

                    <a href="#" className={styles.forgotpswd}><p>Forgot Password?</p></a>
                </div>

                <button
                    className={styles.loginBtn}
                    onClick={handleSubmit}
                >
                    {
                        load_status
                            ?

                            <ButtonLoader
                                loader_style={{
                                    gap: "4px"
                                }}
                                dot_style={{
                                    backgroundColor: "var(--button-text)"
                                }}
                            />
                            :
                            "Log In"
                    }
                </button>
            </div>

            <div className={`${styles.signupoption} ${is_leaving ? styles.evaporate : styles.condensate}`}>
                <p>Don't have an account? <Link to="/signup" onClick={handleTransition}>Sign Up</Link></p>
            </div>

            {
                alert
                &&
                <Alert
                    text={alert}
                    closeHook={setAlert}
                />
            }
        </div>
    );
}

export default SignInPage;