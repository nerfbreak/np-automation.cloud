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
      <SidebarFooter className="border-t p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold uppercase text-primary shrink-0">
            {username.slice(0, 2)}
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
            <span className="text-sm font-medium capitalize">{username}</span>
            <button onClick={handleLogout} className="text-xs text-muted-foreground hover:text-foreground text-left transition-colors">
              Log out
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-3 group-data-[collapsible=icon]:hidden text-center leading-snug">
          © 2026 IT Support Newspage
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
