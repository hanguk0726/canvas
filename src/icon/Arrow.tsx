
export const NoTailArrowRightIcon = () => (
    <svg
        width="17"
        height="30"
        viewBox="0 0 17 30"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M16.5796 15.208L0.0643387 0.740894L0.0643387 29.675L16.5796 15.208Z" fill="currentColor" />
    </svg>
);


export const NoTailArrowLeftIcon = () => (
    <svg
        width="17"
        height="30"
        viewBox="0 0 17 30"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M0.172363 15.208L17.2349 0.740894L17.2349 29.675L0.172363 15.208Z" fill="currentColor" />
    </svg>
);

export const ArrowUpIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="tabler-icon tabler-icon-arrow-up"
        >
            <path d="M12 5l0 14" />
            <path d="M18 11l-6 -6" />
            <path d="M6 11l6 -6" />
        </svg>
    );
};


export const ArrowLeft: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`tabler-icon tabler-icon-arrow-left ${className}`}
        >
            <path d="M5 12l14 0" /> 
            <path d="M5 12l6 6" /> 
            <path d="M5 12l6 -6" />
        </svg>
    );
};

