import { CloseIcon } from "../icon/Close"

export const CloseButton = ({ textColor, textColorHover, onClose }: {
    textColor: string,
    textColorHover: string,
    onClose: () => void
}) => {
    return (
        <button
            className={`absolute top-4 right-4 text-black z-[60] p-1 ${textColor} hover:${textColorHover}`}
            onClick={onClose}
        >
            <CloseIcon />
        </button >
    )
}