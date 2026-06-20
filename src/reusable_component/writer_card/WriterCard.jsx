import { server_url } from '../../configs/server_url.js';
import styles from "./writer_card.module.css";

export default function WriterCard({ writer }) {
    return (
        <div className={styles.card}>

            <div className={styles.imageSection}>
                <img
                    src={
                        writer.sample_url
                            ? `${server_url}/files/${writer.sample_url}`
                            : "https://cdn-icons-png.flaticon.com/512/2541/2541988.png"
                    }
                    alt="sample"
                    style={{
                        objectFit: writer.sample_url ? "cover" : "contain",
                        padding: writer.sample_url ? "0" : "28px",
                        margin: "auto"
                    }}
                    onError={(e) => {
                        e.target.src = "https://cdn-icons-png.flaticon.com/512/2541/2541988.png";
                        e.target.style.objectFit = "contain";
                        e.target.style.padding = "28px";
                    }}
                />
            </div>

            <div className={styles.infoSection}>

                <div className={styles.topRow}>
                    <img
                        src={
                            writer.pfp
                                ? `${server_url}/files/${writer.pfp}`
                                : "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                        }
                        alt="pfp"
                        className={styles.pfp}
                        style={{
                            objectFit: writer.pfp ? "cover" : "contain",
                            padding: writer.pfp ? "0" : "8px"
                        }}
                        onError={(e) => {
                            e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                            e.target.style.objectFit = "contain";
                            e.target.style.padding = "8px";
                        }}
                    />

                    <div>
                        <h3>{writer.username}</h3>
                        <span>⭐ {writer.rating}</span>
                    </div>
                </div>

                <div className={styles.bottomRow}>
                    ₹ {writer.price_per_page}/page
                </div>
                <div className={styles.actions}>
                    <button>Contact</button>
                    <button>Info</button>
                </div>

            </div>

        </div>
    );
}