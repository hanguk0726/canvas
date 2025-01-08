import { ChipButton } from "./ChipButton";
import EditIcon from "../icon/EditIcon";
import classNames from "classnames";
import { ChipButtonProps } from "./types";

const HOVER_BUTTON_CLASSES = "absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300";

const BUTTON_POSITIONS: Record<string, string> = {
    edit: "bottom-2 right-2",
}



export const ImgGrid = ({
    images,
    openEditor
}: {
    images: string[],
    openEditor: (selectedImage: string) => void
}) => {
    const BUTTONS: ChipButtonProps[] = [
        { tooltipKey: 'edit', Icon: EditIcon, tooltip: '편집하기', tooltipPlace: 'top', onClick: (imgIndex: number) => openEditor(images[imgIndex]) },
    ];
    return (
        <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {images.map((image) => (
                    <div className="relative group" key={image}>
                        <div className={classNames(
                            "min-w-[120px] max-w-[510px]",
                            "aspect-square rounded-lg",
                            "image-container"
                        )}>
                            <img
                                src={image}
                                alt={image}
                                className={classNames(
                                    "w-full h-full object-cover",
                                    "image-zoom group-hover:scale-105"
                                )}
                            />
                        </div>

                        {BUTTONS.map(({ tooltipKey, Icon, tooltip, tooltipPlace, onClick }) => (
                            <div
                                key={tooltipKey}
                                className={classNames(
                                    HOVER_BUTTON_CLASSES,
                                    BUTTON_POSITIONS[(tooltipKey || '')]
                                )}
                            >
                                <ChipButton
                                    tooltipKey={tooltipKey}
                                    Icon={Icon}
                                    tooltip={tooltip}
                                    tooltipPlace={tooltipPlace}
                                    onClick={onClick ? () => onClick(images.indexOf(image)) : undefined}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};