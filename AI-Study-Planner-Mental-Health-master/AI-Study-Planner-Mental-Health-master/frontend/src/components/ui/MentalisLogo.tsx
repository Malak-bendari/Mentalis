import type { SVGProps } from "react"

export function MentalisLogo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 48 48"
            fill="none"
            role="img"
            aria-label="Mentalis"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <rect width="48" height="48" rx="12" fill="#7C6BC4" />
            <path d="M16 25a8 8 0 0 1 16 0" fill="#F4A582" />
            <path d="M12 26h24M16 32h16" stroke="#D9D2F0" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    )
}