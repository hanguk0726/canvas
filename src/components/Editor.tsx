
import { useEffect, useState } from 'react';
import { CloseIcon } from '../icon/Close';
import Canvas from './canvas/Canvas';
import { CloseButton } from './CloseButton';

const Editor = ({ image, onClose }: { image: string, onClose: () => void }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // 애니메이션 시간이 끝난 후에 onClose 호출
    };

    return (
        <div className={`modal ${isVisible ? 'show' : ''}`}>

            <CloseButton textColor='text-black' textColorHover='text-black' onClose={handleClose} />
            
            <div className="min-h-screen w-full flex justify-center items-center bg-white">
                <div className='max-w-[700px] aspect-square'>
                    <Canvas imageSrc={image} />
                </div>
            </div>
        </div>
    );
};

export default Editor;