import styles from "./get_started.module.css";
import { server_url } from '../../../../../configs/server_url';
import axios from "axios";
import { useContext } from "react";
import { AppContext } from "../../../../../Contexts";
import { useState } from "react";
import DivLoader from "../../../../loading_screen/DivLoader";
import { useEffect } from "react";

export default function WriterPopup(props) {
    const { show, setShow, ...rem_props } = props;
    const { user_details, setLogout } = useContext(AppContext);
    const [file, setFile] = useState(null);
    const [price, setPrice] = useState(rem_props.price_per_page || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (rem_props.condn !== "update") return;

        setFile(props.sample_url);
        setPrice(props.price_per_page);
    }, [show]);

    if (!show) return null;

    const submitWriter = async () => {
        try {
            if (!file || !price) return;

            setLoading(true);

            const uploadedFile = rem_props.condn !== "update"
                ? ( await uploadFile(file, user_details)).data.files_list[0].file_url
                : rem_props.sample_url;

            await axios.post(
                `${server_url}/orders/writer/${rem_props.condn === "update" ? "update" : "create"}`,
                {
                    writer_id: user_details?.id,
                    sample_url: uploadedFile,
                    price_per_page: price
                },
                {
                    headers: {
                        auth_token: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setLoading(false);
            setShow(false);

        } catch (err) {
            console.error(err);

            if (["INVALID_JWT", "FORBIDDEN"].includes(err.response?.data?.code))
                setLogout();

            setLoading(false);
        }
    };

    return (
        <div className={styles.popupOverlay}>
            <div className={styles.popupBox}>

                <h3>{rem_props.condn === "update" ? "Change Your Preferences" : "Become a Writer"}</h3>

                <div className={styles.popupField}>
                    <label>Handwriting Sample</label>

                    <label className={styles.captureBtn}>
                        <p>Take Sample Picture</p>

                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            hidden
                            onChange={(e) => {
                                const selected = e.target.files[0];
                                if (selected) setFile(selected);
                            }}
                        />
                    </label>

                    {
                        file && (
                            <img
                                src={
                                    typeof file === "string"
                                        ? server_url + "/files/" + rem_props.sample_url
                                        : URL.createObjectURL(file)
                                }
                                alt="sample"
                                className={styles.previewImage}
                            />
                        )
                    }
                </div>

                <div className={styles.popupField}>
                    <label>Price Per Page</label>

                    <input
                        type="number"
                        value={price || ""}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Enter price"
                    />
                </div>

                {
                    loading
                        ?
                        <DivLoader />
                        :
                        <div className={styles.popupActions}>
                            <button onClick={() => setShow(false)}>
                                Cancel
                            </button>

                            <button onClick={submitWriter}>
                                Continue
                            </button>
                        </div>
                }
            </div>
        </div>
    );
}

const uploadFile = async (file, user_details) => {
    const formData = new FormData();

    formData.append("files", file);

    const uploadRes = await axios.post(
        `${server_url}/files/upload?user_id=${user_details?.id || sessionStorage.getItem("user_id")}`,
        formData,
        {
            headers: {
                auth_token: `Bearer ${localStorage.getItem("token")}`
            }
        }
    );

    return uploadRes;
}