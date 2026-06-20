
export default function eposhToString(epoch) {
    const inputDate = new Date(epoch);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

    const diffInMs = today - target;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    if (diffInDays === 0) return "Today";

    if (diffInDays === 1) return "Yesterday";

    if (diffInDays < 7) {
        return `Last ${days[target.getDay()]}`;
    }

    const day = String(target.getDate()).padStart(2, '0');
    const month = String(months[target.getMonth() + 1]).padStart(2, '0');
    const year = target.getFullYear();

    return `${day} ${month} ${year}`;
}