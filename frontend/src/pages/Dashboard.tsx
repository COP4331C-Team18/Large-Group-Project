import DashboardNavBar from '@/components/dashboard/DashboardNavbar';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardMain from '@/components/dashboard/DashboardMain';

export function Dashboard() {

  return (
    <div className="h-screen w-full p-4 flex flex-col gap-3 overflow-hidden">
      
      <DashboardNavBar />
      
      <div className="flex-1 flex flex-row gap-3 overflow-hidden">

        <Sidebar/>

        <DashboardMain />
        
      </div>
    </div>
  );
}
