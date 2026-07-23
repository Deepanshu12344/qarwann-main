import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { adminLogin, useAdminAuth } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAdminAuth();
  const redirectTo =
    (typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("redirect")) ||
    "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: redirectTo, replace: true });
    }
  }, [loading, isAuthenticated, navigate, redirectTo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminLogin(email, password);
      toast.success("Welcome back");
      navigate({ to: redirectTo, replace: true });
    } catch (err: any) {
      toast.error("Sign in failed", { description: err?.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4 py-12 text-primary-foreground">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl bg-background p-8 text-foreground shadow-2xl"
      >
        <div className="text-center">
          <div className="font-serif text-2xl tracking-[0.2em] text-primary">QARWAAN</div>
          <div className="mt-1 text-xs uppercase tracking-[0.25em] text-accent">
            Admin Studio
          </div>
          <h1 className="mt-6 font-serif text-3xl text-primary">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access trips, enquiries, and analytics.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.18em] text-foreground/70">
              Email
            </Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@qarwaan.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.18em] text-foreground/70">
              Password
            </Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" /> Sign in
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
