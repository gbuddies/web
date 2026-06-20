import SignInPage from "./pages/signin_page/SignInPage";
import SignUpPage from "./pages/signup_page/SignUpPage";
import DashBoard from "./pages/dashboard_page/DashBoard";
import RoomPage from "./pages/privateroom_page/RoomPage";
import FriendsPage from "./pages/friends_page/FriendsPage";
import ViewRoom from "./pages/privateroom_page/rooms_view/room_dashboard/ViewRoom";
import RoomHome from "./pages/privateroom_page/rooms_view/room_home/RoomHome";
import Dorakaled from "./pages/page_not_found/404";
import AprilFool from "./pages/page_not_found/AprilFool";
import { LoginProtector } from "./Contexts";
import { Routes, Route } from "react-router-dom";
import LoadingScreen from "./pages/loading_screen/LoadingScreen";
import Settings from "./pages/settings_page/Settings";
import UserSettings from "./pages/user_settings/UserSettings";
import DM from "./pages/direct-messages/DM";
import AssignmentHome from "./pages/dashboard_page/assignments_page/LandingPage";
import MyPortfolio from "./pages/dashboard_page/assignments_page/components/my_portfolio/MyPortfolio";
import BrowseWriters from "./pages/dashboard_page/assignments_page/components/browse_writers/BrowseWriters";
import GlobalChat from "./pages/dashboard_page/global_chat/GlobalChat";

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<SignUpPage />} />

			<Route path="/signin" element={<SignInPage />} />

			<Route path="/signup" element={<SignUpPage />} />

			<Route
				path="/rooms" element={
					<LoginProtector>
						<RoomPage />
					</LoginProtector>
				}
			/>

			<Route path="/room/dashboard/:room_id" element={
				<LoginProtector>
					<ViewRoom />
				</LoginProtector>
			}
			/>

			<Route path="/room/home/:room_id" element={
				<LoginProtector>
					<RoomHome />
				</LoginProtector>
			}
			/>

			<Route
				path="/dashboard" element={
					<LoginProtector>
						<DashBoard />
					</LoginProtector>
				}
			/>

			<Route
				path="/globalchat" element={
					<LoginProtector>
						<GlobalChat />
					</LoginProtector>
				}
			/>

			<Route
				path="/friends" element={
					<LoginProtector>
						<FriendsPage />
					</LoginProtector>
				}
			/>

			<Route
				path="/direct-messages" element={
					<LoginProtector>
						<DM />
					</LoginProtector>
				}
			/>

			<Route
				path="/assignments" element={
					<LoginProtector>
						<AssignmentHome />
					</LoginProtector>
				}
			/>

			<Route
				path="/portfolio" element={
					<LoginProtector>
						<MyPortfolio />
					</LoginProtector>
				}
			/>

			<Route
				path="/browse-writers" element={
					<LoginProtector>
						<BrowseWriters />
					</LoginProtector>
				}
			/>

			<Route
				path="/settings" element={
					<LoginProtector>
						<Settings />
					</LoginProtector>
				}
			/>

			<Route
				path="/user-settings" element={
					<LoginProtector>
						<UserSettings />
					</LoginProtector>
				}
			/>

			<Route
				path="/aprilfool" element={
					<LoginProtector>
						<AprilFool />
					</LoginProtector>
				}
			/>

			<Route path="/loader" element={<LoadingScreen />} />

			<Route
				path="*" element={
					<LoginProtector>
						<Dorakaled />
					</LoginProtector>
				}
			/>
		</Routes>
	);
}