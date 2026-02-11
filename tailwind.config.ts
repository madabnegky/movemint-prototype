import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    navy: "#143C67", // Primary Header/Button
                    teal: "#269B78", // Pre-approved/Success
                    purple: "#8A55FB", // Apply Now/Accent
                    gray: "#262C30", // Primary Text
                    "light-gray": "#F4F8FA", // Background
                    "mid-gray": "#677178", // Secondary Text
                    "border": "#9BA7AE",
                    "hero-blue": "#DCE3ED",
                }
            },
            fontFamily: {
                sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
            }
        },
    },
    plugins: [],
} satisfies Config;
