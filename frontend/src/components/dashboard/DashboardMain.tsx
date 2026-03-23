import InkBoardCard from "@/components/dashboard/BoardCard";
import { INKBOARDS_DATA } from "@/config/dashboard";
import RoomSection from "@/components/dashboard/RoomSection";
import DashboardSection from "@/components/dashboard/DashboardSection";

const DashboardMain = () => {
  return (
    <div className="h-full flex-1 min-w-0"> {/* Use flex-1 and h-full instead of h-screen w-full */}
      <main
          className="w-full h-full rounded-[2.5rem] p-8 flex flex-col overflow-hidden gap-4 bg-[#f4f1ea] border-[1.5px] border-[#A67C5244] shadow-[0_2px_16px_rgba(15,14,13,0.06)]"
        >
                <RoomSection />

            <DashboardSection title="My Boards" className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto custom-scrollbar pr-4">
                      <div className="flex flex-wrap gap-9 pb-8">
                        {INKBOARDS_DATA.map((board) => (
                          <InkBoardCard key={board.id} {...board} />
                        ))}
                      </div>
                </div>
            </DashboardSection>
        </main>
    </div>
  )
}

export default DashboardMain

