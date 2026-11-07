export default function PasswordVisibilityIcon({ visible }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            {visible ? (
                <>
                    <circle cx="12" cy="12" r="3" />
                    <path d="m3 3 18 18" />
                </>
            ) : (
                <circle cx="12" cy="12" r="3" />
            )}
        </svg>
    );
}
