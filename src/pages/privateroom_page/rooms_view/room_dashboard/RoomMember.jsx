import { server_url } from '../../../../configs/server_url';
import styles from "./view_room.module.css";

export default function RoomMember(props) {

    return (
        <div className={styles.member}>
            <img
                src={server_url + `/files/${props.pfp}`}
                onError={e => {
                    e.target.onError = null;
                    e.target.src = "https://cdn-icons-png.flaticon.com/512/4847/4847985.png";
                }}
            />

            <h5>{props.name}</h5>

            <div className={styles.adminTag}>
                {props.admin && <div className={styles.amAdmin}><i className="fa-brands fa-black-tie"></i> Admin</div>}
            </div>

            {
                props.amiadmin
                &&
                <div className={styles.options}>
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                </div>
            }
        </div>
    );
}