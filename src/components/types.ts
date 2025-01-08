export interface ChipButtonProps {
    tooltipKey?: string;
    Icon?: React.FC<React.SVGProps<SVGSVGElement>>;
    iconImg?: string;
    tooltip?: React.ReactNode;
    text?: string;
    textColor?: string;
    textColorHover?: string;
    cursor?: string;
    solidTheme?: boolean;
    bgColor?: string;
    bgColorHover?: string;
    ring?: boolean;
    tooltipPlace?: string; // 'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end'.
    rounded?: boolean;
    onClick?: (param1?: any, param2?: any) => void;
}