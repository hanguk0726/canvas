import { useState } from "react";
import { PlacesType, Tooltip } from "react-tooltip";
import classNames from "classnames";
import { ChipButtonProps } from "./types";


export const ChipButton: React.FC<ChipButtonProps> = ({
    tooltipKey, Icon, iconImg, tooltip, text, tooltipPlace,
    cursor = 'cursor-pointer',
    bgColor = 'bg-gray-dark',
    bgColorHover = 'bg-gray-light',
    ring = false,
    textColor = 'text-white',
    textColorHover = 'text-white',
    solidTheme = false,
    rounded = false,
    onClick
}) => {

    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    const backgroundStyles = {
        solid: {
            default: bgColor,
            hover: bgColorHover
        },
        transparent: {
            default: `${bgColor} bg-opacity-50`,
            hover: `${bgColor} bg-opacity-100`,
        }
    };

    const getBackground = () => {
        const style = solidTheme ? backgroundStyles.solid : backgroundStyles.transparent;
        return isHovered ? style.hover : style.default;
    };

    return (
        <div
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="min-w-[40px] min-h-[30px] flex flex-col items-center"
        >
            {/* 버튼 영역 */}
            <button
                id={tooltipKey}
                className={classNames(
                    getBackground(),
                    cursor,
                    textColor,
                    `hover:${textColorHover}`,
                    'flex items-center rounded p-1 shadow transition duration-200',
                    {
                        'ring-1 ring-gray-500': ring,
                        'rounded-full': rounded,
                    }
                )}
            >
                {iconImg && (<img src={iconImg} alt="Icon" />)}
                {Icon && <Icon />}
                {text && <span className="text-sm mx-2">{text}</span>}
            </button>

            {/* 툴팁 */}
            <Tooltip
                anchorSelect={`#${tooltipKey}`}
                place={tooltipPlace as PlacesType || 'bottom'}
                style={{ borderRadius: '20px', fontSize: '12px' }}
                opacity={1}
            >
                {tooltip}
            </Tooltip>
        </div>
    );
};


