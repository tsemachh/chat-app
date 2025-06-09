import { useChatStore } from "../store/useChatStore";

import UserList from "../components/UserPanel";
import EmptyChat from "../components/EmptyChat";
import ChatContainer from "../components/ChatView";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <UserList />

            {!selectedUser ? <EmptyChat /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;