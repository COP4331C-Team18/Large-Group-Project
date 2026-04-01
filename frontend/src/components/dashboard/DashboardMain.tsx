import InkBoardCard from "./BoardCard";
import { INKBOARDS_DATA } from "@/config/dashboard";
import RoomSection from "./RoomComponent";

const DashboardMain = () => {
  return (
    <div className="h-full flex-1 min-w-0">
      <main
          className="w-full h-full 
          rounded-3xl p-8 flex flex-col overflow-hidden
          shadow-md border border-neutral
          bg-base-200 gap-2"
        >
                <RoomSection />
                
                <div className="divider divider-neutral divider-start text-base-content text-2xl font-serif">Boards</div>
    
                      <div className="flex-wrap gap-9 pt-1 grid grid-cols-5 aspect-video overflow-y-auto custom-scrollbar">
                        {INKBOARDS_DATA.map((board) => (
                          <InkBoardCard key={board.id} {...board} />
                        ))}
                      </div>
        </main>
    </div>
  )
}

export default DashboardMain

