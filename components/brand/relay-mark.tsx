/** Relay logo mark. The project tint (#5e5ce6) is used here and nowhere else. */
export function RelayMark({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="relay-mark"
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
    >
      <svg
        fill="none"
        height={size * 0.58}
        viewBox="0 0 24 24"
        width={size * 0.58}
      >
        <path
          d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5a3.5 3.5 0 0 1-3.5 3.5H11l-4.2 3.6c-.5.4-1.3.1-1.3-.6V15A3.5 3.5 0 0 1 5 11.5v-5Z"
          fill="currentColor"
          opacity="0.96"
        />
        <path
          d="M9.5 9.25h5m0 0-2-2m2 2-2 2"
          stroke="var(--relay-tint)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    </span>
  );
}
