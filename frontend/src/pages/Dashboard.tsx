import DashboardNavBar from '@/components/dashboard/DashboardNavbar';
// import Sidebar from '@/components/dashboard/Sidebar';
import DashboardMain from '@/components/dashboard/DashboardMain';

export default function Dashboard() {

  return (
    <div className="h-screen w-full gap-0.5 flex flex-col bg-base-100 overflow-hidden">
      
      <DashboardNavBar />
      
      <div className="flex-1 flex flex-row overflow-hidden">
        {/*<Sidebar />*/}
        <DashboardMain />
      </div>
    </div>
  );
}
