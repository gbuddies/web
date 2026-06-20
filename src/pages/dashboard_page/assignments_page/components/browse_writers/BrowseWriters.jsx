import { useEffect, useState } from "react";
import styles from "./browse_writers.module.css";
import WriterCard from "../../../../../reusable_component/writer_card/WriterCard";
import axios from "axios";
import { server_url } from '../../../../../configs/server_url';
import { useContext } from "react";
import { AppContext } from "../../../../../Contexts";
import PageLoader from "../../../../loading_screen/PageLoader";

export default function BrowseWriters() {
    const { user_details, setLogout } = useContext(AppContext);
    const [writers, setWriters] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        axios.get(
            `${server_url}/orders/writer/all?user_id=${user_details?.id || sessionStorage.getItem("user_id")}`,
            {
                headers: {
                    auth_token: `Bearer ${localStorage.getItem("token")}`
                }
            }
        )
            .then((res) => {
                setWriters(res.data.writers);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);

                if (["INVALID_JWT", "FORBIDDEN"].includes(err.response?.data?.code))
                    setLogout();

                setLoading(false);
            });

    }, []);

    const filteredWriters = writers.filter((writer) =>
        writer.username
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <div className={styles.page}>

            <div className={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Search writers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {
                loading
                    ?
                    <PageLoader />
                    :
                    <div className={styles.grid}>
                        {filteredWriters.map((writer) => (
                            <WriterCard
                                key={writer.writer_id}
                                writer={writer}
                            />
                        ))}
                    </div>
            }

        </div>
    );
}