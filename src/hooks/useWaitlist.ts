import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .email("Please enter a valid email address.")
    .max(255, "Email address is too long."),
});

type WaitlistStatus = "idle" | "loading" | "success" | "error";

export function useWaitlist() {
  const [status, setStatus] = useState<WaitlistStatus>("idle");

  async function joinWaitlist(email: string) {
    // Client-side validation
    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      toast({
        title: "Invalid email",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return false;
    }

    setStatus("loading");

    // If Supabase is not configured, show a friendly message
    if (!supabase) {
      toast({
        title: "Almost there!",
        description: "Connect your Supabase project to start saving waitlist signups.",
      });
      setStatus("idle");
      return false;
    }

    try {
      const { error } = await supabase
        .from("waitlist")
        .insert([{ email: result.data.email }]);

      if (error) {
        // Handle duplicate email (unique constraint violation)
        if (error.code === "23505") {
          toast({
            title: "Already on the list!",
            description: "This email is already registered. We'll be in touch soon.",
          });
          setStatus("idle");
          return true;
        }
        throw error;
      }

      toast({
        title: "You're on the list.",
        description: "We'll reach out when SafeHands is ready for you.",
      });
      setStatus("success");
      return true;
    } catch (err) {
      console.error("Waitlist error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      setStatus("error");
      return false;
    }
  }

  return { joinWaitlist, status };
}
