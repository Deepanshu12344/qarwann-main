import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Plane,
  Inbox,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

import { useAdminAuth } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "QARWAAN Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/trips", label: "Trips", icon: Plane },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox },
];

function AdminLayout() {
  const { isAuthenticated, loading, user, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isLoginPage = location.pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !isAuthenticated && !isLoginPage) {
      navigate({ to: "/admin/login", replace: true });
    }
  }, [loading, isAuthenticated, isLoginPage, navigate]);

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading admin...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <Link to="/admin" className="font-serif text-lg tracking-[0.18em] text-primary">
          QARWAAN
        </Link>
        <button
          aria-label="Menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-md p-2 text-foreground/80 hover:bg-muted"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-background transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="hidden border-b border-border px-6 py-5 md:block">
              <Link to="/admin" className="font-serif text-xl tracking-[0.2em] text-primary">
                QARWAAN
              </Link>
              <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-accent">
                Admin Studio
              </div>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {NAV.map((n) => {
                const active = n.exact
                  ? location.pathname === n.to
                  : location.pathname === n.to ||
                    location.pathname.startsWith(`${n.to}/`);
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border p-4">
              <div className="mb-3 text-xs text-muted-foreground">
                Signed in as
                <div className="truncate font-medium text-foreground">{user?.email}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  logout();
                  navigate({ to: "/admin/login", replace: true });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </div>
        </aside>

        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
          />
        )}

        <main className="min-h-screen flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
