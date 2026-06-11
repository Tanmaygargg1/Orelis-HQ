import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { SidebarProvider } from "@/context/sidebar";
import DndProvider from "@/context/dnd";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DndProvider>
        <div className="flex h-full bg-zinc-950 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <MobileHeader />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </DndProvider>
    </SidebarProvider>
  );
}
