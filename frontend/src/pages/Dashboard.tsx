import DashboardNavBar from '@/components/dashboard/DashboardNavbar';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardMain from '@/components/dashboard/DashboardMain';

export function Dashboard() {

  return (
    <div className="h-screen w-full p-3 flex flex-col bg-[#ede8df] gap-3 overflow-hidden">
      
      <DashboardNavBar />
      
      <div className="flex-1 flex flex-row gap-3 overflow-hidden">
      <div className="flex flex-row items-stretch gap-3 w-full h-full">
    <Sidebar />
    <DashboardMain />
  </div>
      </div>
    </div>
  );
}
