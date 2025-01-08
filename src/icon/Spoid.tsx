import React from 'react';

const SpoidIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 36 36"
        preserveAspectRatio="xMidYMid meet"
        fill="currentColor"
        width="24px"
        height="24px"
        {...props} // Allows passing custom props such as className, style, etc.
    >
        <title>color-picker-solid</title>
        <path d="M33.73,2.11a4.09,4.09,0,0,0-5.76.1L22.81,7.38a3.13,3.13,0,0,1-4.3.11L17.09,8.91,27,18.79l1.42-1.42A3.18,3.18,0,0,1,28.46,13l5.17-5.17A4.08,4.08,0,0,0,33.73,2.11Z" className="clr-i-solid clr-i-solid-path-1" />
        <path d="M22.18,16.79,7.46,31.51a2,2,0,1,1-2.82-2.83L19.35,14l-1.41-1.41L3.22,27.27a4,4,0,0,0-.68,4.8L1.06,33.55a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l1.44-1.44a3.93,3.93,0,0,0,2.09.6,4.06,4.06,0,0,0,2.88-1.2L23.6,18.21Z" className="clr-i-solid clr-i-solid-path-2" />
        <rect x="0" y="0" width="36" height="36" fillOpacity="0" />
    </svg>
);

export default SpoidIcon;
