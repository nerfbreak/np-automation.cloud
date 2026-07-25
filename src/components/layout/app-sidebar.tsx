"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Activity,
  Bot,
  CalendarClock,
  Database,
  FileCode2,
  KeyRound,
  LayoutDashboard,
  PackageSearch,
  Settings,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Sparkles,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },


  {
    title: "Templates",
    url: "/templates",
    icon: FileCode2,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: Activity,
  },
  {
    title: "Report",
    url: "/report",
    icon: ClipboardList,
  },
];

const systemItems = [
  {
    title: "Master Data",
    url: "/master-data",
    icon: Database,
    items: [
      {
        title: "Distributor Credentials",
        url: "/master-data/distributor-credentials",
        tab: "distributor-credentials",
      },
      {
        title: "SKU Exceptions",
        url: "/master-data/sku-exceptions",
        tab: "sku-exceptions",
      },
      {
        title: "SKU Multipliers",
        url: "/master-data/sku-multipliers",
        tab: "sku-multipliers",
      }
    ]
  },
  {
    title: "Audit Logs",
    url: "/settings/audit-logs",
    icon: ShieldAlert,
  },
  {
    title: "Changelog",
    url: "/changelog",
    icon: Sparkles,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const getRoleLabel = (user: string) => {
  const normalized = user.toLowerCase().trim()
  if (normalized.includes("rizki")) return "Superuser"
  if (normalized.includes("noval")) return "IT Central Support"
  if (normalized.includes("fadli")) return "IT West Support"
  if (normalized.includes("bagus")) return "IT East Support"
  return "IT Support"
}

export function AppSidebar() {
  const router = useRouter();
  const [username, setUsername] = useState("Support Agent");
  
  useEffect(() => {
    // Extract username from cookie safely on client side
    const match = document.cookie.match(new RegExp('(^| )np_user=([^;]+)'));
    if (match) {
      try {
        const user = JSON.parse(decodeURIComponent(match[2]));
        if (user.username) setUsername(user.username);
      } catch (e) {}
    }
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [title]: prev[title] === undefined ? !pathname.startsWith("/master-data") : !prev[title]
    }));
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b h-14 flex items-center justify-center px-4">
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <span className="truncate font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Newspage Automation
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                    render={
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {systemItems.map((item) => {
                if (item.items) {
                  const isOpen = openGroups[item.title] ?? pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        isActive={pathname.startsWith(item.url)}
                        onClick={() => toggleGroup(item.title)}
                        render={
                          <button>
                            <item.icon />
                            <span>{item.title}</span>
                            <ChevronRight 
                              className={`ml-auto h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                            />
                          </button>
                        }
                      />
                      {isOpen && (
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton 
                                isActive={pathname === subItem.url || (pathname === "/master-data" && searchParams?.get("tab") === subItem.tab)}
                                render={
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                }
                              />
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  )
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                      render={
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-3 group-data-[collapsible=icon]:p-2">
        {/* User Profile Card */}
        <div className="flex items-center gap-3 bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 w-full group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-none">
          {/* Avatar Area */}
          <div className="h-9 w-9 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-sm font-bold uppercase text-white shrink-0">
            {username.slice(0, 1)}
          </div>
          
          {/* Profile Details (hidden when sidebar collapsed) */}
          <div className="flex flex-col flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-white leading-tight capitalize truncate max-w-[80px]">
                {username}
              </span>
              <span className="text-[9px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-medium">
                {getRoleLabel(username)}
              </span>
            </div>
            <span className="text-[10px] text-blue-400 font-mono tracking-tight mt-0.5">
              Active Session
            </span>
          </div>

          {/* Logout Trigger (hidden when sidebar collapsed) */}
          <button 
            onClick={handleLogout} 
            className="ml-auto text-zinc-400 hover:text-zinc-200 transition-colors p-1 shrink-0 group-data-[collapsible=icon]:hidden"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        
        <p className="text-[9px] text-muted-foreground/30 mt-3 group-data-[collapsible=icon]:hidden text-center leading-snug">
          © 2026 IT Support Newspage
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
