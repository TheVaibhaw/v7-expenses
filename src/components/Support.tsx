"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CREATOR_INSTAGRAM_URL, CREATOR_INSTAGRAM_HANDLE } from "@/lib/constants";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-5 w-5 sm:h-6 sm:w-6">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function Support() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="support" className="px-4 py-12 sm:px-6 sm:py-16 md:py-20">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        whileHover={reduceMotion ? undefined : { scale: 1.01 }}
        className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl p-[1.5px]"
        style={{
          background: "linear-gradient(120deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)",
        }}
      >
        <div
          aria-hidden
          className="animate-float-slow pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
          style={{ background: "linear-gradient(120deg, #fa7e1e, #d62976)" }}
        />

        <div className="relative rounded-[calc(1rem-1.5px)] bg-white px-6 py-10 text-center sm:px-10 sm:py-12">
          <motion.span
            initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full text-white sm:h-14 sm:w-14"
            style={{
              background: "linear-gradient(135deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)",
            }}
          >
            <InstagramIcon />
          </motion.span>

          <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
            Did this save you some time?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-slate-600 sm:text-base">
            This tool is free and always will be. If it helped you settle up after a market run
            or a group expense, following along on Instagram is the easiest way to support what
            gets built next.
          </p>

          <motion.a
            href={CREATOR_INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer me"
            whileHover={reduceMotion ? undefined : { scale: 1.05 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className="mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition-shadow hover:shadow-xl hover:shadow-pink-500/30 sm:text-base"
            style={{
              background: "linear-gradient(135deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)",
            }}
          >
            <InstagramIcon />
            Follow @{CREATOR_INSTAGRAM_HANDLE}
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}
